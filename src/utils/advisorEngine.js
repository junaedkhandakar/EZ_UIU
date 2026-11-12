import { ALL_COURSES, ADVISOR_COURSE_MAP, MAJOR_TRACKS, GED_ELECTIVES } from '../data/advisorData';
import { GRADE_POINTS } from './cgpaUtils';
import { retrieveRelevantDocuments, buildRagAugmentedPrompt } from './ragEngine';
import { promptCache } from './cacheUtils';

const SLOT_ORDER = ['T1', 'T2', 'T3'];

export const FREE_MODELS_CASCADE = [
  'deepseek/deepseek-r1:free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
];

/**
 * Supported AI Providers configuration with Prompt Caching Architecture
 */
export const AI_PROVIDERS = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter AI',
    badge: 'Universal AI Engine',
    description: 'Powered by Vercel serverless AI with auto-switching across free models (DeepSeek R1, Gemini 2.0, Llama 3.3). Zero setup required.',
    requiresKey: false,
    models: [
      { id: 'auto-free', name: 'Auto-Switch (Cycles Every Free AI API)' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free Reasoning)' },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free Speed)' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free Accuracy)' },
      { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free)' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Prompt Caching Enabled)' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Prompt Caching)' },
      { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o Mini' },
    ],
    defaultModel: 'auto-free',
  },
  offline: {
    id: 'offline',
    name: 'UIU Regulations Engine',
    badge: '100% On-Device · Zero Net',
    description: 'Deterministic offline expert knowledge engine encoded with official UIU academic policies.',
    requiresKey: false,
    models: [{ id: 'rule-engine', name: 'UIU Regulations Engine v2' }],
    defaultModel: 'rule-engine',
  },
};

/**
 * Normalize course codes: "CSE1115", "cse 1115" -> "CSE 1115"
 */
export function normalizeCode(code) {
  if (!code) return '';
  const clean = String(code).toUpperCase().trim();
  const match = clean.match(/^([A-Z]{2,4})\s*(\d{4}[A-Z]?)$/);
  if (match) return `${match[1]} ${match[2]}`;
  return clean;
}

export function findCourse(code) {
  const norm = normalizeCode(code);
  return ADVISOR_COURSE_MAP[norm] || null;
}

/**
 * Get set of passed course codes from student course record
 */
export function getPassedCoursesSet(courseList = []) {
  const passed = new Set();
  courseList.forEach((c) => {
    const code = normalizeCode(c.courseId || c.course_code);
    const grade = (c.grade || '').toUpperCase();
    if (code && grade && grade !== 'F' && grade !== 'W' && (GRADE_POINTS[grade] || 0) >= 1.0) {
      passed.add(code);
    }
  });
  return passed;
}

/**
 * Check if all prerequisites are met for a given course
 */
export function arePrerequisitesMet(course, passedSet) {
  if (!course.prerequisites || course.prerequisites.length === 0) return true;
  return course.prerequisites.every((prereq) => passedSet.has(normalizeCode(prereq)));
}

/**
 * Calculate how many future downstream courses this course unlocks
 */
export function calculateUnlockingPower(targetCode, passedSet) {
  const code = normalizeCode(targetCode);
  let directUnlockCount = 0;
  let indirectUnlockCount = 0;

  ALL_COURSES.forEach((other) => {
    const otherCode = normalizeCode(other.course_code);
    if (passedSet.has(otherCode) || otherCode === code) return;

    const prereqs = (other.prerequisites || []).map(normalizeCode);
    if (prereqs.includes(code)) {
      directUnlockCount++;
      const missingCount = prereqs.filter((p) => !passedSet.has(p) && p !== code).length;
      if (missingCount === 0) {
        indirectUnlockCount += 2;
      }
    }
  });

  return directUnlockCount * 3 + indirectUnlockCount;
}

/**
 * Detect exam slot conflicts and tight exam pairs
 */
export function detectExamConflicts(courseBasket = []) {
  const conflicts = [];
  const tightExams = [];

  for (let i = 0; i < courseBasket.length; i++) {
    for (let j = i + 1; j < courseBasket.length; j++) {
      const a = courseBasket[i];
      const b = courseBasket[j];
      if (a.exam_day && b.exam_day && a.exam_day === b.exam_day) {
        if (a.exam_slot && b.exam_slot && a.exam_slot === b.exam_slot) {
          conflicts.push({
            courseA: a.course_code,
            courseB: b.course_code,
            day: a.exam_day,
            slot: a.exam_slot,
            desc: `Both ${a.course_code} and ${b.course_code} have final exams on ${a.exam_day} at ${a.exam_slot}`,
          });
        } else if (a.exam_slot && b.exam_slot) {
          const gap = Math.abs(SLOT_ORDER.indexOf(a.exam_slot) - SLOT_ORDER.indexOf(b.exam_slot));
          if (gap === 1) {
            tightExams.push({
              courseA: a.course_code,
              courseB: b.course_code,
              day: a.exam_day,
              slots: `${a.exam_slot} & ${b.exam_slot}`,
              desc: `Back-to-back exams on ${a.exam_day}: ${a.course_code} (${a.exam_slot}) & ${b.course_code} (${b.exam_slot})`,
            });
          }
        }
      }
    }
  }
  return { conflicts, tightExams };
}

/**
 * Generate optimal Next-Trimester Recommended Course Basket
 */
export function generateRecommendedBasket({
  completedCourses = [],
  currentCgpa = 3.0,
  targetCredits = 12,
  selectedMajor = '',
}) {
  const passedSet = getPassedCoursesSet(completedCourses);

  const eligibleCourses = ALL_COURSES.filter((course) => {
    const code = normalizeCode(course.course_code);
    if (passedSet.has(code)) return false;
    return arePrerequisitesMet(course, passedSet);
  });

  const scoredCourses = eligibleCourses.map((course) => {
    const code = normalizeCode(course.course_code);
    const unlockingScore = calculateUnlockingPower(code, passedSet);
    const difficulty = (course.difficulty || 'Medium').toLowerCase();

    let priorityScore = unlockingScore * 4;

    if (course.trimester) {
      priorityScore += Math.max(0, (12 - course.trimester) * 5);
    }

    if (course.type === 'Core') priorityScore += 25;
    else if (course.type === 'Lab') priorityScore += 15;

    if (selectedMajor && MAJOR_TRACKS[selectedMajor]) {
      const majorCodes = MAJOR_TRACKS[selectedMajor].courses.map((c) => normalizeCode(c.course_code));
      if (majorCodes.includes(code)) {
        priorityScore += 30;
      }
    }

    if (currentCgpa < 2.5 && difficulty === 'hard') {
      priorityScore -= 40;
    } else if (currentCgpa >= 3.5 && difficulty === 'hard') {
      priorityScore += 10;
    }

    return {
      ...course,
      priorityScore,
      unlockingScore,
      reasonTags: [],
    };
  });

  scoredCourses.sort((a, b) => b.priorityScore - a.priorityScore);

  const basket = [];
  let currentCredits = 0;
  let hardCourseCount = 0;

  for (const candidate of scoredCourses) {
    const candidateCredit = candidate.credit || 3;
    const diff = (candidate.difficulty || 'Medium').toLowerCase();

    if (diff === 'hard' && hardCourseCount >= (currentCgpa >= 3.0 ? 2 : 1)) {
      continue;
    }

    if (currentCredits + candidateCredit > targetCredits + 1.5) {
      continue;
    }

    const testBasket = [...basket, candidate];
    const { conflicts } = detectExamConflicts(testBasket);
    if (conflicts.length > 0) {
      continue;
    }

    const reasons = [];
    if (candidate.unlockingScore >= 6) {
      reasons.push(`Key Bottleneck (Unlocks ${Math.round(candidate.unlockingScore / 3)}+ courses)`);
    }
    if (candidate.type === 'Core') reasons.push('Required Core');
    if (candidate.type === 'Lab') reasons.push('Practical Lab');
    if (selectedMajor && MAJOR_TRACKS[selectedMajor]?.courses.some((c) => normalizeCode(c.course_code) === normalizeCode(candidate.course_code))) {
      reasons.push(`${selectedMajor} Elective`);
    }

    basket.push({
      ...candidate,
      reasons: reasons.slice(0, 2),
    });

    currentCredits += candidateCredit;
    if (diff === 'hard') hardCourseCount++;

    if (currentCredits >= targetCredits) break;
  }

  let workloadGrade = 'Balanced';
  let workloadColor = 'text-ok';
  if (hardCourseCount >= 2 && currentCredits >= 13) {
    workloadGrade = 'Demanding Workload';
    workloadColor = 'text-warn';
  } else if (currentCredits > 15) {
    workloadGrade = 'Heavy Overload';
    workloadColor = 'text-bad';
  }

  const { conflicts, tightExams } = detectExamConflicts(basket);

  return {
    basket,
    totalCredits: currentCredits,
    hardCourseCount,
    workloadGrade,
    workloadColor,
    eligibleCount: eligibleCourses.length,
    examConflicts: conflicts,
    tightExams,
  };
}

/**
 * Full Multi-Trimester Degree Auto-Planner (Semester by Semester to 138/141 cr)
 */
export function generateFullDegreeRoadmap({
  completedCourses = [],
  currentCgpa = 3.0,
  maxCreditsPerSem = 13.5,
  selectedMajor = 'Software Engineering',
}) {
  const passedSet = new Set(Array.from(getPassedCoursesSet(completedCourses)));
  const completedCr = Array.from(passedSet).reduce((sum, code) => {
    const c = findCourse(code);
    return sum + (c?.credit || 3);
  }, 0);

  const startSem = Math.min(12, Math.max(1, Math.ceil(completedCr / 12) + 1));
  const plannedSemesters = [];
  const plannedCodes = new Set(passedSet);

  const majorElectives = (MAJOR_TRACKS[selectedMajor]?.courses || []).map((c) => ({
    ...c,
    category: 'MAJOR_ELECTIVE',
  }));

  for (let sem = startSem; sem <= 12; sem++) {
    let semCredits = 0;
    const semCourses = [];

    // Step 1: Core courses for this curriculum trimester or earlier
    const uncompletedCore = ALL_COURSES.filter((c) => {
      const code = normalizeCode(c.course_code);
      if (plannedCodes.has(code) || c.category === 'MAJOR_ELECTIVE') return false;
      return arePrerequisitesMet(c, plannedCodes);
    }).sort((a, b) => {
      const powerA = calculateUnlockingPower(a.course_code, plannedCodes);
      const powerB = calculateUnlockingPower(b.course_code, plannedCodes);
      return powerB - powerA;
    });

    for (const c of uncompletedCore) {
      if (semCredits + c.credit <= maxCreditsPerSem) {
        semCourses.push(c);
        semCredits += c.credit;
        plannedCodes.add(normalizeCode(c.course_code));
      }
    }

    // Step 2: Major electives if room left
    for (const c of majorElectives) {
      const code = normalizeCode(c.course_code);
      if (plannedCodes.has(code)) continue;
      if (!arePrerequisitesMet(c, plannedCodes)) continue;

      if (semCredits + c.credit <= maxCreditsPerSem) {
        semCourses.push(c);
        semCredits += c.credit;
        plannedCodes.add(code);
      }
    }

    // Step 3: GED open credit electives
    for (const c of GED_ELECTIVES) {
      const code = normalizeCode(c.course_code);
      if (plannedCodes.has(code)) continue;
      if (semCredits + c.credit <= maxCreditsPerSem) {
        semCourses.push(c);
        semCredits += c.credit;
        plannedCodes.add(code);
      }
    }

    if (semCourses.length > 0) {
      plannedSemesters.push({
        trimesterNum: sem,
        title: `Trimester ${sem}`,
        credits: semCredits,
        courses: semCourses,
      });
    }

    if (plannedCodes.size >= ALL_COURSES.length) break;
  }

  return plannedSemesters;
}

/**
 * Custom Course Schedule Auditor ("Can I Take These Together?")
 */
export function auditCustomSchedule({
  selectedCodes = [],
  completedCourses = [],
  currentCgpa = 3.0,
}) {
  const passedSet = getPassedCoursesSet(completedCourses);
  const validCourses = [];
  const blockedCourses = [];
  let totalCredits = 0;
  let hardCount = 0;

  selectedCodes.forEach((rawCode) => {
    const code = normalizeCode(rawCode);
    const course = findCourse(code);

    if (!course) {
      blockedCourses.push({
        code,
        reason: 'Course not recognized in curriculum database',
      });
      return;
    }

    if (passedSet.has(code)) {
      blockedCourses.push({
        code,
        course,
        reason: 'Already passed this course in previous trimester',
      });
      return;
    }

    if (!arePrerequisitesMet(course, passedSet)) {
      const missing = (course.prerequisites || []).filter(
        (p) => !passedSet.has(normalizeCode(p))
      );
      blockedCourses.push({
        code,
        course,
        missing,
        reason: `Missing prerequisites: ${missing.join(', ')}`,
      });
      return;
    }

    validCourses.push(course);
    totalCredits += course.credit || 3;
    if ((course.difficulty || '').toLowerCase() === 'hard') hardCount++;
  });

  const { conflicts, tightExams } = detectExamConflicts(validCourses);

  let workloadStatus = 'SAFE';
  let workloadMsg = 'Balanced workload with safe exam spacing';
  if (conflicts.length > 0) {
    workloadStatus = 'CLASH';
    workloadMsg = 'Critical: Final exam slot collision detected!';
  } else if (hardCount >= 2 && totalCredits >= 12) {
    workloadStatus = 'HEAVY';
    workloadMsg = 'Demanding: 2+ Hard courses in the same trimester';
  } else if (totalCredits > 15) {
    workloadStatus = 'OVERLOAD';
    workloadMsg = 'Overload: Exceeds standard 15-credit load';
  }

  return {
    validCourses,
    blockedCourses,
    examConflicts: conflicts,
    tightExams,
    totalCredits,
    hardCount,
    workloadStatus,
    workloadMsg,
    isValid: blockedCourses.length === 0 && conflicts.length === 0,
  };
}

/**
 * Recursive Prerequisite Chain Resolver
 * Finds the entire tree of prerequisites required to unlock a target course
 */
export function getPrerequisiteTree(targetCode, completedCourses = []) {
  const norm = normalizeCode(targetCode);
  const target = findCourse(norm);
  if (!target) return null;

  const passedSet = getPassedCoursesSet(completedCourses);
  const visited = new Set();
  const chain = [];

  function traverse(code, depth = 0) {
    const c = findCourse(code);
    if (!c || visited.has(code)) return;
    visited.add(code);

    const isTarget = code === norm;
    const isPassed = passedSet.has(code);

    (c.prerequisites || []).forEach((prereq) => {
      traverse(normalizeCode(prereq), depth + 1);
    });

    if (!isTarget) {
      chain.push({
        code: c.course_code,
        name: c.course_name,
        credit: c.credit,
        difficulty: c.difficulty,
        depth,
        isPassed,
      });
    }
  }

  traverse(norm, 0);

  return {
    target,
    isTargetPassed: passedSet.has(norm),
    arePrereqsMet: arePrerequisitesMet(target, passedSet),
    prerequisitesList: chain,
  };
}

/**
 * Calculate graduation timeline, pacing, and FYDP readiness
 */
export function calculateDegreeTimeline({
  completedCredits = 0,
  totalDegreeCredits = 138,
  currentTrimester = 4,
  targetTrimester = 12,
}) {
  const safeCompleted = Math.max(0, completedCredits);
  const remainingCredits = Math.max(0, totalDegreeCredits - safeCompleted);
  const remainingTrimesters = Math.max(1, targetTrimester - currentTrimester + 1);
  const creditsPerTermNeeded = parseFloat((remainingCredits / remainingTrimesters).toFixed(1));

  let paceStatus = 'ON_TRACK';
  let paceLabel = 'Comfortable Pace';
  let paceColor = 'text-ok';

  if (remainingCredits <= 0) {
    paceStatus = 'COMPLETED';
    paceLabel = 'Degree Requirements Completed';
    paceColor = 'text-ok';
  } else if (creditsPerTermNeeded > 15) {
    paceStatus = 'OVERLOAD';
    paceLabel = 'Heavy Overload Risk';
    paceColor = 'text-bad';
  } else if (creditsPerTermNeeded > 13) {
    paceStatus = 'HEAVY';
    paceLabel = 'Moderate / High Pace';
    paceColor = 'text-warn';
  }

  const FYDP_MIN_CREDITS = 80;
  const fydpEligible = safeCompleted >= FYDP_MIN_CREDITS;
  const creditsToFydp = Math.max(0, FYDP_MIN_CREDITS - safeCompleted);

  return {
    safeCompleted,
    totalDegreeCredits,
    remainingCredits,
    remainingTrimesters,
    creditsPerTermNeeded,
    paceStatus,
    paceLabel,
    paceColor,
    fydpEligible,
    creditsToFydp,
    fydpMinCredits: FYDP_MIN_CREDITS,
  };
}

/**
 * Verified Official UIU System Prompt injected across all AI models
 */
export function buildUIUSystemPrompt(studentContext = {}) {
  return `
You are the official AI Academic Advisor for United International University (UIU) in Dhaka, Bangladesh.
You assist UIU students with curriculum advising, course registration, prerequisite chains, honors graduation, and tuition fee policies.

Official UIU Policies (Verified & Strictly Enforced):
1. Degree Credit Requirements:
   - B.Sc. in CSE (Summer 2026 Batch onwards): 141.0 credits total (requires 4 track elective courses).
   - B.Sc. in CSE (Prior Batches): 138.0 credits total (requires 3 track elective courses) or 137.0 credits (Spring 2023 - Spring 2026).
   - B. Pharm: 165.0 credits (Semester-based).
2. Official Grading Scale:
   - A (4.00): 90% – 100% (Outstanding)
   - A- (3.67): 86% – <90% (Excellent)
   - B+ (3.33): 82% – <86% (Good)
   - B (3.00): 78% – <82% (Average)
   - B- (2.67): 74% – <78% (Below Average)
   - C+ (2.33): 70% – <74% (Satisfactory)
   - C (2.00): 66% – <70% (Pass)
   - C- (1.67): 62% – <66% (Pass)
   - D+ (1.33): 58% – <62% (Pass)
   - D (1.00): 55% – <58% (Lowest Passing Grade)
   - F (0.00): Below 55% (Fail)
   - Passing Grade: Minimum grade to pass any course is 'D' (1.00). Minimum CGPA for graduation is 2.00.
3. Convocation Latin Honors:
   - Summa Cum Laude: CGPA >= 3.90
   - Magna Cum Laude: CGPA >= 3.80
   - Cum Laude: CGPA >= 3.75
4. Academic Probation Policy:
   - Maintaining a CGPA below 2.00 results in Academic Probation.
   - For undergraduate students with < 60 completed credits, a maximum of 3 probation notices are served in consecutive terms.
   - If Term GPA >= 2.00 during the 3rd probation, student is allowed to continue; if Term GPA < 2.00, dismissed.
   - Term registration strictly capped at 9–12 credits per trimester.
   - Department changes are strictly forbidden while on probation.
5. Retake & Repeat Policy:
   - Permitted for courses with grade C+ or below (C+, C, C-, D+, D, F).
   - 50% Course Fee Waiver: Automatically waived by 50% for the first time retaken.
   - Grade Replacement: The new grade completely replaces the old grade in the CGPA formula (marked with 'R' on official transcript).
6. Merit Scholarships & Tuition Waivers:
   - Minimum GPA requirement: GPA >= 3.50 in the preceding trimester exam.
   - Distribution in order of merit:
     • Top 2% of program: 100% Tuition Fee Waiver
     • Next 4% of program: 50% Tuition Fee Waiver
     • Next 4% of program: 25% Tuition Fee Waiver
   - Minimum Credit Load: Must register for at least 9 credits in a trimester (14 credits for Pharmacy).
   - Exclusions: Waivers do NOT apply to Thesis/FYDP, Retake/Repeat courses, Projects, or Internships.
   - Only the single highest waiver applies (no stacking).
   - Incomplete ('I') grade or improvement exams in a term forfeit merit scholarship in the following term.
7. Final Year Design Project (FYDP):
   - CSE 4000A (FYDP I - 2 cr) and CSE 4000B (FYDP II - 4 cr).
   - Gatekeeper: Must have at least 80 credits completed before registering for CSE 4000A.
   - Graduation requirement: Must pass FYDP with at least a 'C' grade.
   - Exempt from all tuition waivers (0% waiver).
8. Attendance & Final Exams:
   - Minimum 80% class attendance required to be eligible for final examinations.
   - Final Exam Slots: T1 (9:00 AM – 11:00 AM), T2 (11:30 AM – 1:30 PM), T3 (2:00 PM – 4:00 PM / 2:30 PM – 4:30 PM).
9. Tuition & Fees Structure:
   - Regular/CSE: Tk. 6,500/- per credit (Batch ≥ 241) or Tk. 5,525/- (Batch < 241); English/MSJ: Tk. 5,525/- per credit.
   - Trimester Activity Fee: Tk. 6,500/- per trimester.
   - Installment Schedule: 40% (during registration/advising), 30% (before midterm exam), 30% (before final exam).

Student Profile & Current Academic Record:
- Current CGPA: ${studentContext.cgpa || 'N/A'}
- Completed Credits: ${studentContext.completedCredits || 0} cr
- Completed Courses: ${(studentContext.completedCourseCodes || []).join(', ') || 'None'}
- Selected Major Track: ${studentContext.selectedMajor || 'General CSE'}

Instructions: Provide concise, friendly, and structured advice formatted in GitHub-flavored Markdown. Always prioritize accuracy with official UIU policies.
`;
}

/**
 * Intelligent Academic Q&A Rule-Engine (100% Client-side Offline Engine)
 */
export function generateAIAnswer(query, context = {}) {
  const q = (query || '').toLowerCase();
  const cgpa = typeof context.cgpa === 'number' ? context.cgpa : 0;
  const completedCr = context.completedCredits || 0;

  if (q.includes('fydp') || q.includes('thesis') || q.includes('project')) {
    if (completedCr >= 80) {
      return `**You are eligible for FYDP I (CSE 4000A)!**\n\n• **Requirement:** UIU regulations strictly require **80 credits completed** before registering for Final Year Design Project I.\n• **Passing Grade:** You must achieve at least a **'C' grade** in FYDP to qualify for graduation.\n• **Tuition Policy:** Thesis/FYDP credits are **exempt from all tuition waivers** (0% scholarship applies).\n\n*Tip:* Form your project group and finalize your supervisor early during advising week!`;
    }
    return `**FYDP / Thesis Eligibility Gatekeeper:**\n\n• **Your Status:** You currently have **${completedCr} completed credits**.\n• **Requirement:** UIU Department of CSE requires **80 credits completed** before registering for CSE 4000A.\n• **Gap:** You need **${80 - completedCr} more credits** before you can register.\n• **Tuition Note:** Thesis/FYDP credits receive 0% tuition fee waiver under UIU regulations.`;
  }

  if (q.includes('retake') || q.includes('repeat')) {
    return `**Official UIU Retake & Repeat Policy:**\n\n• **Eligibility:** You can retake any course where you earned a grade of **C+, C, C-, D+, D, or F**.\n• **Grade Replacement:** The **new grade completely replaces** the old grade in your CGPA calculation! (The previous attempt remains marked with 'R' on your transcript, but its grade points are zeroed out).\n• **50% Tuition Discount:** UIU provides an **automatic 50% waiver on the course fee** for the first time you retake a course!\n• **Scholarship Restriction:** Merit waivers do not stack with retakes.`;
  }

  if (q.includes('waiver') || q.includes('scholarship') || q.includes('merit')) {
    return `**Official UIU Merit Scholarship & Waiver Policy:**\n\n• **Minimum GPA Requirement:** You must obtain at least **GPA 3.50** in the preceding trimester examination.\n• **Distribution by Rank:**\n  - Top 2% of batch: **100% Tuition Fee Waiver**\n  - Next 4% of batch: **50% Tuition Fee Waiver**\n  - Next 4% of batch: **25% Tuition Fee Waiver**\n• **Minimum Credit Load:** You must register for at least **9 credits** in the term (14 credits for Pharmacy).\n• **Exclusions:** Waivers do NOT apply to Thesis/FYDP, Projects, Internships, Retakes, or Repeat courses.\n• **Single Highest Policy:** Only the single best waiver can be availed; multiple scholarships do not stack.`;
  }

  if (q.includes('probation') || cgpa < 2.0) {
    return `**UIU Academic Probation Regulations:**\n\n• **Threshold:** Maintaining a CGPA below **2.00** places a student on academic probation.\n• **Notice Limit:** Students with under 60 completed credits get a maximum of **3 probation notices** in consecutive trimesters.\n• **3rd Probation Rule:** If you score a Term GPA $\\ge$ 2.00 during your 3rd probation, you may continue on extended probation; if Term GPA < 2.00, you face academic dismissal.\n• **Registration Cap:** Strictly limited to **9 to 12 credits** per trimester.\n• **Department Transfers:** Department transfers are strictly forbidden while on probation.\n• **Fast Recovery:** Retake low-credit 'F' or 'D' courses first — new grades replace old points directly in the cumulative formula!`;
  }

  if (q.includes('honors') || q.includes('laude') || q.includes('summa') || q.includes('magna') || q.includes('convocation')) {
    return `**UIU Convocation Latin Honors Criteria:**\n\n• **Summa Cum Laude:** CGPA $\\ge$ **3.90**\n• **Magna Cum Laude:** CGPA $\\ge$ **3.80**\n• **Cum Laude:** CGPA $\\ge$ **3.75**\n• **Good Standing:** CGPA $\\ge$ **2.00** (Minimum required for graduation)\n• **Probation:** CGPA < **2.00**\n\n*Note:* Clear academic record without disciplinary sanctions is required for convocation honors.`;
  }

  if (q.includes('fee') || q.includes('cost') || q.includes('tuition') || q.includes('installment')) {
    return `**Official UIU Tuition Fees & Payment Schedule:**\n\n• **Per-Credit Rate:** **Tk. 6,500/-** per credit for BSCSE, BBA, EEE (Tk. 5,525/- for English/MSJ).\n• **Trimester Activity Fee:** **Tk. 6,500/-** per trimester (Tk. 9,750/- per semester for B. Pharm).\n• **Installment Schedule (3 Installments):**\n  - **1st Installment (40%):** Payable during course registration / advising week.\n  - **2nd Installment (30%):** Payable before Midterm Examinations.\n  - **3rd Installment (30%):** Payable before Final Examinations.\n• **Down Payment Plan:** Initial down payment of Tk. 15,000 at registration + 40/30/30 of remaining balance.`;
  }

  if (q.includes('grade') || q.includes('grading') || q.includes('scale') || q.includes('marks')) {
    return `**Official UIU Grading Scale:**\n\n| Numerical Score | Letter Grade | Grade Point | Assessment |\n| :--- | :---: | :---: | :--- |\n| 90% – 100% | **A** | 4.00 | Outstanding |\n| 86% – <90% | **A-** | 3.67 | Excellent |\n| 82% – <86% | **B+** | 3.33 | Good |\n| 78% – <82% | **B** | 3.00 | Average |\n| 74% – <78% | **B-** | 2.67 | Below Average |\n| 70% – <74% | **C+** | 2.33 | Satisfactory |\n| 66% – <70% | **C** | 2.00 | Pass |\n| 62% – <66% | **C-** | 1.67 | Pass |\n| 58% – <62% | **D+** | 1.33 | Pass |\n| 55% – <58% | **D** | 1.00 | Lowest Passing Grade |\n| Below 55% | **F** | 0.00 | Fail |\n\nMinimum passing grade is **D (1.00)**. Graduation requires a cumulative CGPA $\\ge$ **2.00**.`;
  }

  if (q.includes('attendance') || q.includes('absence')) {
    return `**UIU Class Attendance Regulation:**\n\n• UIU strictly enforces an **80% minimum class attendance** rule for all undergraduate programs.\n• Students with attendance below 80% without approved medical documentation are **debarred from sitting for the final examination** in that course.`;
  }

  if (q.includes('exam slot') || q.includes('exam time') || q.includes('t1') || q.includes('t2') || q.includes('t3')) {
    return `**Official UIU Final Exam Time Slots:**\n\n• **T1 Slot:** 9:00 AM – 11:00 AM\n• **T2 Slot:** 11:30 AM – 1:30 PM\n• **T3 Slot:** 2:00 PM – 4:00 PM (or 2:30 PM – 4:30 PM)\n\n*Tip:* Use the **Schedule Auditor** tab to stress-test your courses and ensure you have zero same-day slot collisions!`;
  }

  if (q.includes('incomplete') || q.includes('withdraw') || q.includes('grade change')) {
    return `**UIU Academic Status Rules:**\n\n• **'W' (Withdrawn):** Course dropped within the official withdrawal window. Does not impact CGPA or count toward attempted grade points.\n• **'I' (Incomplete):** Permitted only under documented medical emergencies. Must be cleared by sitting for the exam in the next term, otherwise it automatically converts to an **F**.\n• **Grade Change Deadline:** Grade change petitions must be submitted to the department head within the first week of the subsequent trimester.`;
  }

  if (q.includes('data science') || q.includes('software') || q.includes('major') || q.includes('track') || q.includes('specialization')) {
    return `**Major Concentration Tracks in BSCSE:**\n\nUIU Department of CSE offers 5 specialization tracks:\n1. **Software Engineering** (CSE 4451, CSE 4435, CSE 4181, CSE 4495, CSE 4945)\n2. **AI & Data Science** (CSE 4889, CSE 4891, CSE 4817, CSE 4893)\n3. **Network & Cybersecurity** (CSE 4783, CSE 4777, CSE 4791, CSE 4779)\n4. **Systems & Cloud** (CSE 4621, CSE 4587, CSE 4511, CSE 4515)\n5. **Computational Theory** (CSE 4611, CSE 4633, CSE 4635, CSE 4637)\n\n*Rule:* Complete **4 elective courses** (12 credits) from your track for Summer 2026+ curriculum (or 3 courses for legacy batches) to officially declare the specialization on your transcript!`;
  }

  // Pop Culture Easter Eggs
  if (q.includes('power level') || q.includes('over 9000')) {
    return `**IT'S OVER 9000!**\n\n*(Scouter shatters)* Wait... Vegeta, look at the screen! UIU CGPA is strictly capped at **4.00**, so your maximum power level is a **4.00 Summa Cum Laude**! Now train for your Discrete Mathematics midterm!`;
  }

  if (q.includes('say my name') || q.includes('heisenberg') || q.includes('let him cook')) {
    return `**You're Heisenberg.**\n\n"I am not in danger of probation, Skyler. I am the danger. A student gets an F and you think that of me? No. **I am the one who retakes with a 50% waiver!**"\n\nNow put on the hazmat suit and study for Data Structures. Let him cook!`;
  }

  if (q.includes('force') || q.includes('jedi') || q.includes('yoda') || q.includes('high ground')) {
    return `**"It's over Anakin! I have the High Ground (3.90+ Summa Cum Laude)!"**\n\n*"Do or do not, there is no retake... well actually at UIU you CAN retake for 50% off if you get a C+ or below, but master the Force you must!"* — Master Yoda`;
  }

  if (q.includes('winter is coming') || q.includes('game of thrones') || q.includes('stark')) {
    return `**Winter is Coming... and so are Midterm Examinations!**\n\nThe night is dark and full of error logs. But fear not, Lord of Winterfell! Review your syllabus, clear your prerequisite bottlenecks, and secure your 3.50 GPA merit waiver before the White Walkers arrive!`;
  }

  if (q.includes('cake is a lie') || q.includes('portal') || q.includes('glados')) {
    return `**"The cake is a lie... but the UIU 100% Merit Waiver is NOT a lie!"**\n\n(As long as you stay in the top 2% of your batch with a GPA ≥ 3.50!). Aperture Science thanks you for participating in this academic advising test.`;
  }

  if (q.includes('matrix') || q.includes('red pill') || q.includes('neo') || q.includes('morpheus')) {
    return `**"You take the blue pill, the story ends. You wake up in your bed and believe whatever you want. You take the red pill, you stay in UIU, and I show you how deep the CGPA rabbit hole goes."**\n\nWelcome to the Real World, Neo. Remember: there is no spoon, but there ARE 80% mandatory class attendance rules!`;
  }

  if (q.includes('one does not simply') || q.includes('mordor') || q.includes('lord of the rings') || q.includes('gandalf')) {
    return `**"One does not simply walk into the UIU Vice Chancellor's office without 80 credits for FYDP!"**\n\nFly, you fools! Clear your Algorithms and Discrete Math prerequisites before stepping into the fires of Mount Doom!`;
  }

  const statusSummary = completedCr > 0
    ? `Based on your current CGPA of **${cgpa.toFixed(2)}** and **${completedCr} credits completed**`
    : `Based on your academic record (${completedCr} completed credits)`;

  return `**Academic Advising Recommendation:** ${statusSummary}, prioritize clearing all bottleneck prerequisites (Discrete Math, Data Structures, Algorithms) while keeping a balanced mix of 1 Hard Core + 2 Medium Core + 1 Lab to sustain a strong CGPA.\n\n*You can ask me about: FYDP eligibility, retake rules, merit scholarships, exam clash slots, tuition fees, or major tracks!*`;
}

/**
 * Universal Multi-Provider AI Academic Advisor Connector with Full RAG Architecture,
 * Prompt Caching (OpenRouter prefix cache + Client LRU cache), and Multi-turn Memory.
 */
export async function queryUniversalAIAdvisor({
  provider = 'openrouter',
  apiKey = '',
  model = '',
  prompt = '',
  studentContext = {},
  conversationHistory = [],
  bypassCache = false,
}) {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) throw new Error('Question prompt cannot be empty.');
  const startTime = Date.now();

  // Step 1: Perform RAG Document Retrieval over verified UIU knowledge base
  const retrievedSources = retrieveRelevantDocuments(cleanPrompt, 3);

  // Step 2: Check Client-side Prompt Cache for instant 0ms response
  const chosenModel = model || AI_PROVIDERS[provider]?.defaultModel || 'deepseek/deepseek-r1:free';
  if (!bypassCache && provider !== 'offline') {
    const cached = promptCache.get({
      prompt: cleanPrompt,
      model: chosenModel,
      provider,
      cgpa: studentContext.cgpa,
      completedCredits: studentContext.completedCredits,
      major: studentContext.selectedMajor,
    });
    if (cached) {
      return {
        ...cached,
        retrievedSources,
        isClientCached: true,
        latencyMs: 0,
      };
    }
  }

  // Step 3: Build RAG-augmented prompt embedding verified policy clauses
  const augmentedPrompt = buildRagAugmentedPrompt({
    query: cleanPrompt,
    studentContext,
    retrievedDocs: retrievedSources,
  });

  // Provider 1: Offline Engine
  if (provider === 'offline') {
    const offlineReply = generateAIAnswer(cleanPrompt, studentContext);
    return {
      text: offlineReply,
      retrievedSources,
      latencyMs: Date.now() - startTime,
      isClientCached: false,
    };
  }

  const systemInstructions = buildUIUSystemPrompt(studentContext);

  // Serverless Cloud AI (Vercel): Queries /api/chat which uses OPENROUTER_API_KEY from Vercel environment
  if (provider === 'openrouter') {
    try {
      const serverlessRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'openrouter',
          model: chosenModel,
          prompt: cleanPrompt,
          augmentedPrompt,
          systemInstructions,
          conversationHistory,
          studentContext,
        }),
      });

      if (serverlessRes.ok) {
        const json = await serverlessRes.json();
        if (json?.text) {
          const resultPayload = {
            text: json.text,
            retrievedSources,
            usage: json.usage || {},
            latencyMs: json.latencyMs || Date.now() - startTime,
            isClientCached: false,
            isServerless: true,
            model: json.model || chosenModel,
          };

          promptCache.set(
            {
              prompt: cleanPrompt,
              model: chosenModel,
              provider,
              cgpa: studentContext.cgpa,
              completedCredits: studentContext.completedCredits,
              major: studentContext.selectedMajor,
            },
            resultPayload
          );

          return resultPayload;
        }
      }
    } catch {}
  }

  // Fallback to verified deterministic UIU regulations engine (zero network/setup needed)
  return {
    text: generateAIAnswer(cleanPrompt, studentContext),
    retrievedSources,
    latencyMs: Date.now() - startTime,
    isClientCached: false,
    provider: 'UIU Regulations Engine',
  };
}

/**
 * Generate context-aware follow-up question suggestions
 */
export function generateFollowUpSuggestions(query = '', reply = '') {
  const q = (query + ' ' + reply).toLowerCase();
  const suggestions = [];

  if (q.includes('fydp') || q.includes('thesis')) {
    suggestions.push('What grade do I need in FYDP to graduate?');
    suggestions.push('Can I get a scholarship waiver on FYDP credits?');
    suggestions.push('What are the prerequisites for CSE 4000B?');
  } else if (q.includes('retake') || q.includes('repeat')) {
    suggestions.push('How much is the tuition fee for a retake course?');
    suggestions.push('Will the old grade show on my transcript?');
    suggestions.push('Can I retake a course if I got a B-?');
  } else if (q.includes('waiver') || q.includes('scholarship')) {
    suggestions.push('What is the minimum credit load for a scholarship?');
    suggestions.push('Does UIU have a sibling waiver discount?');
    suggestions.push('What happens if I take an Incomplete grade?');
  } else if (q.includes('probation') || q.includes('cgpa')) {
    suggestions.push('How many probation notices can I get before dismissal?');
    suggestions.push('Can I change my department while on probation?');
    suggestions.push('What is the maximum credit limit on probation?');
  } else if (q.includes('fee') || q.includes('tuition') || q.includes('installment')) {
    suggestions.push('What are the 3 installment payment deadlines?');
    suggestions.push('What is the per-credit fee for BSCSE?');
    suggestions.push('Is there a late fee penalty at UIU?');
  } else if (q.includes('track') || q.includes('major') || q.includes('specialization')) {
    suggestions.push('How many elective courses do I need for Software Engineering?');
    suggestions.push('What courses are in the AI & Data Science track?');
    suggestions.push('Can I take electives from different tracks?');
  } else {
    suggestions.push('What are the requirements for Summa Cum Laude?');
    suggestions.push('When do final exam schedules get published?');
    suggestions.push('What is the minimum attendance required for finals?');
  }

  return suggestions.slice(0, 3);
}

/**
 * Legacy Gemini Connector (Alias for backwards compatibility)
 */
export async function queryGeminiAdvisor({ apiKey, prompt, studentContext }) {
  const res = await queryUniversalAIAdvisor({
    provider: 'gemini',
    apiKey,
    model: 'gemini-1.5-flash',
    prompt,
    studentContext,
  });
  return res.text;
}

/**
 * Detects if EZ_UIU is deployed on Vercel with serverless AI environment variables configured
 */
export async function checkVercelServerlessStatus() {
  try {
    const res = await fetch('/api/chat', { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}
