import { ALL_COURSES, ADVISOR_COURSE_MAP, MAJOR_TRACKS, GED_ELECTIVES } from '../data/advisorData';
import { GRADE_POINTS } from './cgpaUtils';

const SLOT_ORDER = ['T1', 'T2', 'T3'];

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
      reasons.push(`⚡ Key Bottleneck (Unlocks ${Math.round(candidate.unlockingScore / 3)}+ courses)`);
    }
    if (candidate.type === 'Core') reasons.push('📘 Required Core');
    if (candidate.type === 'Lab') reasons.push('🧪 Practical Lab');
    if (selectedMajor && MAJOR_TRACKS[selectedMajor]?.courses.some((c) => normalizeCode(c.course_code) === normalizeCode(candidate.course_code))) {
      reasons.push(`🎯 ${selectedMajor} Elective`);
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
 * Full Multi-Trimester Degree Auto-Planner (Semester by Semester to 138 cr)
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

  const FYDP_MIN_CREDITS = 100;
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
 * Intelligent Academic Q&A Rule-Engine (Offline fallback)
 */
export function generateAIAnswer(query, context = {}) {
  const q = (query || '').toLowerCase();
  const cgpa = context.cgpa || 3.0;
  const completedCr = context.completedCredits || 0;

  if (q.includes('fydp') || q.includes('thesis') || q.includes('project')) {
    if (completedCr >= 100) {
      return `🎉 **You are eligible for FYDP I (CSE 4000A)!** UIU regulations require **100 credits completed** before registering for Final Year Design Project I. Make sure you form your group and finalize your supervisor early during advising week.`;
    }
    return `⚠️ **FYDP / Thesis Eligibility Notice:** You currently have **${completedCr} completed credits**. UIU requires a minimum of **100 credits completed** before FYDP I registration. You need **${100 - completedCr} more credits** before you can register for CSE 4000A.`;
  }

  if (q.includes('retake') || q.includes('repeat')) {
    return `💡 **UIU Retake Rule:** When you retake a course with grade **C+, C, C-, D+, D, or F**, the **new grade completely replaces** the old grade in your CGPA calculation! The previous attempt stays on your official transcript, but its grade points are zeroed out in the cumulative formula. Retakes also receive a **50% tuition waiver**!`;
  }

  if (q.includes('waiver') || q.includes('scholarship')) {
    return `💰 **UIU Merit Scholarship Policy:**\n• **Minimum Load Requirement:** You must register for at least **9 credits** (14 credits for Pharmacy) to be eligible for any merit waiver.\n• **Exclusions:** Thesis / FYDP credits (CSE 4000A/B) receive **0% waiver** under university regulations.\n• **Retake Discount:** Retakes automatically get a **50% tuition waiver** independently of merit scholarships.`;
  }

  if (q.includes('probation') || cgpa < 2.0) {
    return `🚨 **Academic Probation Policy:** Maintaining a CGPA below **2.00** results in academic probation. Students on probation are strictly capped at **9 to 12 credits** per trimester. The fastest recovery strategy is to retake low-credit 'F' or 'D' courses because new grades replace old points directly.`;
  }

  if (q.includes('grade') || q.includes('grading') || q.includes('scale') || q.includes('marks')) {
    return `📊 **Official UIU Grading System:**
• **A (4.00):** 90% – 100% (Outstanding)
• **A- (3.67):** 86% – <90% (Excellent)
• **B+ (3.33):** 82% – <86% (Good)
• **B (3.00):** 78% – <82% (Average)
• **B- (2.67):** 74% – <78% (Below Average)
• **C+ (2.33):** 70% – <74% (Satisfactory)
• **C (2.00):** 66% – <70% (Pass)
• **C- (1.67):** 62% – <66% (Pass)
• **D+ (1.33):** 58% – <62% (Pass)
• **D (1.00):** 55% – <58% (Lowest Passing Grade)
• **F (0.00):** Below 55% (Fail)

Minimum passing grade is **D (1.00)**. Graduation requires a cumulative CGPA $\\ge$ **2.00**.`;
  }

  if (q.includes('attendance') || q.includes('absence')) {
    return `📋 **UIU Class Attendance Policy:**
• UIU strictly enforces an **80% minimum class attendance** rule for all undergraduate programs.
• Falling below 80% attendance without approved medical documentation makes a student ineligible to sit for the final examination in that course.`;
  }

  if (q.includes('exam slot') || q.includes('exam time') || q.includes('t1') || q.includes('t2') || q.includes('t3')) {
    return `⏰ **UIU Final Exam Time Slots:**
• **T1 Slot:** 9:00 AM – 11:00 AM
• **T2 Slot:** 11:30 AM – 1:30 PM
• **T3 Slot:** 2:00 PM – 4:00 PM (or 2:30 PM – 4:30 PM)

The Schedule Auditor checks your courses to ensure no two courses share the same exam day and time slot!`;
  }

  if (q.includes('incomplete') || q.includes('withdraw') || q.includes('grade change')) {
    return `📝 **UIU Academic Status Rules:**
• **'W' (Withdrawn):** Course dropped within the official withdrawal window. Does not impact CGPA or count toward attempted grade points.
• **'I' (Incomplete):** Permitted only under extreme documented emergencies. Must be cleared by sitting for the exam in the next trimester, otherwise it automatically converts to an **F**.
• **Grade Change Deadline:** Grade change petitions must be submitted to the department head within the first week of the subsequent trimester.`;
  }

  if (q.includes('data science') || q.includes('software') || q.includes('major')) {
    return `🎯 **Major Concentration Tracks:** UIU CSE requires completing at least **3 courses (9 credits)** from your chosen major track (such as Software Engineering or Data Science). Head over to the **Major Concentration** tab to review required electives and track your progress!`;
  }

  return `📚 **Academic Advising Recommendation:** Based on your current CGPA of **${cgpa.toFixed(2)}** and **${completedCr} credits completed**, prioritize clearing all bottleneck prerequisites (Discrete Math, Data Structures, Algorithms) while keeping a balanced mix of 1 Hard Core + 2 Medium Core + 1 Lab to sustain a strong CGPA.`;
}

/**
 * Optional Google Gemini 1.5 Flash Connector
 * Connects directly to Google Generative Language API if user enters an API key
 */
export async function queryGeminiAdvisor({ apiKey, prompt, studentContext }) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please enter a Google Gemini API Key in the settings field.');
  }

  const systemInstructions = `
You are the official AI Academic Advisor for United International University (UIU) in Dhaka, Bangladesh.
You assist UIU students with curriculum advising, course registration, prerequisite chains, honors graduation, and tuition fee policies.

Official UIU Policies (Strictly adhere to these):
1. Degree Requirements: 138 credits (141 for new curriculum) for BSCSE, 165 for B. Pharm.
2. Official Grading Scale:
   - A (4.00): 90% - 100%
   - A- (3.67): 86% - <90%
   - B+ (3.33): 82% - <86%
   - B (3.00): 78% - <82%
   - B- (2.67): 74% - <78%
   - C+ (2.33): 70% - <74%
   - C (2.00): 66% - <70%
   - C- (1.67): 62% - <66%
   - D+ (1.33): 58% - <62%
   - D (1.00): 55% - <58% (Minimum passing grade)
   - F (0.00): Below 55%
3. Honors Graduation Thresholds:
   - Summa Cum Laude: CGPA >= 3.90
   - Magna Cum Laude: CGPA >= 3.80
   - Cum Laude: CGPA >= 3.75
   - Academic Probation: CGPA < 2.00 (registration strictly capped at 9-12 credits/term)
4. Retake Policy: Grade replacement for C+ or below. New grade completely replaces old grade in CGPA calculation (designated with 'R' on transcript). Retakes receive an automatic 50% course fee waiver.
5. Tuition Waiver Rules: Minimum 9 credits registration required (14 for Pharmacy). Waivers do NOT apply to Thesis/FYDP, projects, internships, or retakes.
6. Class Attendance: Minimum 80% class attendance required to be eligible for final examinations.
7. FYDP I (CSE 4000A): Requires at least 100 completed credits.
8. Exam Slots: T1 (9:00 AM - 11:00 AM), T2 (11:30 AM - 1:30 PM), T3 (2:00 PM - 4:00 PM / 2:30 PM - 4:30 PM).

Student Context:
- Current CGPA: ${studentContext.cgpa || 'N/A'}
- Completed Credits: ${studentContext.completedCredits || 0} cr
- Completed Courses: ${(studentContext.completedCourseCodes || []).join(', ') || 'None'}
- Selected Major Track: ${studentContext.selectedMajor || 'General CSE'}

Provide concise, highly accurate, and structured advice with markdown formatting.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstructions}\n\nStudent Question:\n${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 600,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini API error (HTTP ${response.status})`);
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error('No response text generated by Gemini.');

  return reply;
}
