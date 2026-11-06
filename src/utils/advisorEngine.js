import { ALL_COURSES, ADVISOR_COURSE_MAP, MAJOR_TRACKS } from '../data/advisorData';
import { GRADE_POINTS } from './cgpaUtils';

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

/**
 * Get set of passed course codes from student course record
 */
export function getPassedCoursesSet(courseList = []) {
  const passed = new Set();
  courseList.forEach((c) => {
    const code = normalizeCode(c.courseId || c.course_code);
    const grade = (c.grade || '').toUpperCase();
    if (code && grade && grade !== 'F' && grade !== 'W' && GRADE_POINTS[grade] >= 1.0) {
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
      // Check if this course is the last remaining prerequisite
      const missingCount = prereqs.filter((p) => !passedSet.has(p) && p !== code).length;
      if (missingCount === 0) {
        indirectUnlockCount += 2;
      }
    }
  });

  return directUnlockCount * 3 + indirectUnlockCount;
}

/**
 * Check if courses in a basket share identical final exam day and slot
 */
export function detectExamConflicts(courseBasket = []) {
  const conflicts = [];
  for (let i = 0; i < courseBasket.length; i++) {
    for (let j = i + 1; j < courseBasket.length; j++) {
      const a = courseBasket[i];
      const b = courseBasket[j];
      if (
        a.exam_day &&
        b.exam_day &&
        a.exam_slot &&
        b.exam_slot &&
        a.exam_day === b.exam_day &&
        a.exam_slot === b.exam_slot
      ) {
        conflicts.push({
          courseA: a.course_code,
          courseB: b.course_code,
          slot: `${a.exam_day} (${a.exam_slot})`,
        });
      }
    }
  }
  return conflicts;
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

  // Find all unlocked, uncompleted courses
  const eligibleCourses = ALL_COURSES.filter((course) => {
    const code = normalizeCode(course.course_code);
    if (passedSet.has(code)) return false;
    return arePrerequisitesMet(course, passedSet);
  });

  // Calculate scores for each eligible course
  const scoredCourses = eligibleCourses.map((course) => {
    const code = normalizeCode(course.course_code);
    const unlockingScore = calculateUnlockingPower(code, passedSet);
    const difficulty = (course.difficulty || 'Medium').toLowerCase();

    let priorityScore = unlockingScore * 4;

    // Prioritize earlier curriculum trimesters
    if (course.trimester) {
      priorityScore += Math.max(0, (12 - course.trimester) * 5);
    }

    // Core course bonus
    if (course.type === 'Core') priorityScore += 25;
    else if (course.type === 'Lab') priorityScore += 15;

    // Major elective bonus if matching selected major
    if (selectedMajor && MAJOR_TRACKS[selectedMajor]) {
      const majorCodes = MAJOR_TRACKS[selectedMajor].courses.map((c) => normalizeCode(c.course_code));
      if (majorCodes.includes(code)) {
        priorityScore += 30;
      }
    }

    // Difficulty gating based on CGPA
    if (currentCgpa < 2.5 && difficulty === 'hard') {
      priorityScore -= 40; // Discourage heavy courses on probation
    } else if (currentCgpa >= 3.5 && difficulty === 'hard') {
      priorityScore += 10; // High achievers can tackle hard prerequisites early
    }

    return {
      ...course,
      priorityScore,
      unlockingScore,
      reasonTags: [],
    };
  });

  // Sort by priority descending
  scoredCourses.sort((a, b) => b.priorityScore - a.priorityScore);

  // Greedy selection under target credit cap without exam slot conflicts
  const basket = [];
  let currentCredits = 0;
  let hardCourseCount = 0;

  for (const candidate of scoredCourses) {
    const candidateCredit = candidate.credit || 3;
    const diff = (candidate.difficulty || 'Medium').toLowerCase();

    // Workload limit: max 1 hard course if CGPA < 3.0, max 2 if >= 3.0
    if (diff === 'hard' && hardCourseCount >= (currentCgpa >= 3.0 ? 2 : 1)) {
      continue;
    }

    // Credit limit check
    if (currentCredits + candidateCredit > targetCredits + 1.5) {
      continue;
    }

    // Check exam conflict with currently selected basket
    const testBasket = [...basket, candidate];
    const conflicts = detectExamConflicts(testBasket);
    if (conflicts.length > 0) {
      continue; // Skip this candidate to avoid exam clash
    }

    // Add reason tags
    const reasons = [];
    if (candidate.unlockingScore >= 6) {
      reasons.push(`⚡ Key Bottleneck (Unlocks ${Math.round(candidate.unlockingScore / 3)}+ courses)`);
    }
    if (candidate.type === 'Core') {
      reasons.push('📘 Required Core');
    }
    if (candidate.type === 'Lab') {
      reasons.push('🧪 Practical Lab');
    }
    if (selectedMajor && MAJOR_TRACKS[selectedMajor]?.courses.some((c) => normalizeCode(c.course_code) === normalizeCode(candidate.course_code))) {
      reasons.push(`🎯 ${selectedMajor} Major Elective`);
    }

    basket.push({
      ...candidate,
      reasons: reasons.slice(0, 2),
    });

    currentCredits += candidateCredit;
    if (diff === 'hard') hardCourseCount++;

    if (currentCredits >= targetCredits) break;
  }

  // Workload analysis
  let workloadGrade = 'Balanced';
  let workloadColor = 'text-ok';
  if (hardCourseCount >= 2 && currentCredits >= 13) {
    workloadGrade = 'Demanding Workload';
    workloadColor = 'text-warn';
  } else if (currentCredits > 15) {
    workloadGrade = 'Heavy Overload';
    workloadColor = 'text-bad';
  }

  return {
    basket,
    totalCredits: currentCredits,
    hardCourseCount,
    workloadGrade,
    workloadColor,
    eligibleCount: eligibleCourses.length,
    examConflicts: detectExamConflicts(basket),
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

  // FYDP / Thesis Eligibility Check (UIU requires 100+ credits completed before FYDP I)
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
 * Intelligent Academic Q&A Rule-Engine
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

  if (q.includes('data science') || q.includes('software') || q.includes('major')) {
    return `🎯 **Major Concentration Tracks:** UIU CSE requires completing at least **3 courses (9 credits)** from your chosen major track (such as Software Engineering or Data Science). Head over to the **Major Concentration** tab to review required electives and track your progress!`;
  }

  return `📚 **Academic Advising Recommendation:** Based on your current CGPA of **${cgpa.toFixed(2)}** and **${completedCr} credits completed**, prioritize clearing all bottleneck prerequisites (Discrete Math, Data Structures, Algorithms) while keeping a balanced mix of 1 Hard Core + 2 Medium Core + 1 Lab to sustain a strong CGPA.`;
}
