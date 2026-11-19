/**
 * EZ_UIU - Academic Advisor Engine
 *
 * Three layers:
 *
 *   1. Deterministic tools (advisorTools.js) compute every number about a
 *      student. The advisor never asks a language model to do arithmetic on a
 *      transcript.
 *   2. The rule engine (generateAIAnswer) answers policy questions offline
 *      from the same verified clauses the RAG index uses, so the offline mode
 *      is not a second, weaker source of truth.
 *   3. The serverless model (queryUniversalAIAdvisor) receives the retrieved
 *      clauses as its only policy source and the tool results as facts.
 *
 * The prompts are deliberately flat: no cheerleading, no invented facts, no
 * filler, and an explicit instruction to say when the published UIU documents
 * do not answer the question.
 */

import {
  MAJOR_TRACKS,
  LEGACY_MAJOR_TRACKS,
  CURRENT_MAJOR_MIN_ELECTIVES,
  TOTAL_ELECTIVES_REQUIRED,
  ELECTIVE_TRIMESTERS,
  GED_TRIMESTERS,
  COURSE_CATEGORY,
} from '../data/advisorData';
import { GRADE_POINTS } from './cgpaUtils';
import { retrieveRelevantDocuments, buildRagAugmentedPrompt } from './ragEngine';
import { promptCache } from './cacheUtils';
import {
  normalizeCode,
  ALL_COURSES,
  findCourse,
  getPassedCoursesSet,
  getRunningCoursesSet,
  computeTranscriptStats,
  evaluateProbation,
  evaluateFydpEligibility,
  evaluateDegreeProgress,
  evaluateSpecializationProgress,
  evaluateElectiveProgress,
  estimateTuition,
  meritScholarshipOutlook,
  detectExamConflicts,
  estimateCurrentTrimester,
  describeStanding,
  projectCgpa,
  GED_OPTIONAL_COUNT,
  MERIT_SCHOLARSHIP_GPA,
  MIN_CREDITS_PER_TRIMESTER,
  FYDP_MIN_CREDITS,
  GRADUATION_CGPA_MINIMUM,
  DEGREE_CREDITS,
  TUITION_PER_CREDIT,
  TUITION_PER_CREDIT_DISCOUNTED,
  TRIMESTER_FEE,
} from './advisorTools';

export {
  normalizeCode,
  findCourse,
  getPassedCoursesSet,
  computeTranscriptStats,
  evaluateProbation,
  evaluateFydpEligibility,
  evaluateDegreeProgress,
  evaluateSpecializationProgress,
  evaluateElectiveProgress,
  estimateTuition,
  meritScholarshipOutlook,
  detectExamConflicts,
  describeStanding,
  projectCgpa,
};

/* ------------------------------------------------------------------ *
 * Prerequisite logic
 * ------------------------------------------------------------------ */

/**
 * Are all prerequisites met for a course?
 */
export function arePrerequisitesMet(course, passedSet) {
  if (!course?.prerequisites?.length) return true;
  return course.prerequisites.every((prereq) => passedSet.has(normalizeCode(prereq)));
}

/**
 * How many downstream courses a course unlocks, and how many of those unlock
 * further. Used to prioritise bottleneck courses.
 */
export function calculateUnlockingPower(targetCode, passedSet) {
  const code = normalizeCode(targetCode);
  let direct = 0;
  let indirect = 0;

  for (const other of ALL_COURSES) {
    const otherCode = normalizeCode(other.course_code);
    if (passedSet.has(otherCode) || otherCode === code) continue;

    const prereqs = (other.prerequisites || []).map(normalizeCode);
    if (!prereqs.includes(code)) continue;

    direct++;
    const missing = prereqs.filter((p) => !passedSet.has(p) && p !== code);
    if (missing.length === 0) indirect += 2;
  }

  return direct * 3 + indirect;
}

/**
 * Prerequisites a course is still missing.
 */
export function missingPrerequisites(course, passedSet) {
  if (!course?.prerequisites?.length) return [];
  return course.prerequisites
    .map(normalizeCode)
    .filter((p) => !passedSet.has(p));
}

/* ------------------------------------------------------------------ *
 * Recommended basket
 * ------------------------------------------------------------------ */

/**
 * Choose the next trimester's courses.
 *
 * The basket respects the official 9-credit scholarship floor as a soft
 * target, prefers courses the student is eligible for, avoids exam-slot
 * collisions, and prioritises bottleneck courses so the plan does not stall.
 */
export function generateRecommendedBasket({
  completedCourses = [],
  currentCgpa = 3.0,
  targetCredits = 12,
  selectedMajor = '',
  excludedCodes = [],
}) {
  const passedSet = getPassedCoursesSet(completedCourses);
  const runningSet = getRunningCoursesSet(completedCourses);
  const excluded = new Set(excludedCodes.map(normalizeCode));

  const eligible = ALL_COURSES.filter((course) => {
    const code = normalizeCode(course.course_code);
    if (passedSet.has(code) || runningSet.has(code) || excluded.has(code)) return false;
    if (!arePrerequisitesMet(course, passedSet)) return false;
    // FYDP needs the credit gate and a supervisor, so it is never auto-offered.
    if (course.category === COURSE_CATEGORY.PROJECT) return false;
    return true;
  });

  const majorCodes = selectedMajor
    ? new Set(
        (MAJOR_TRACKS[selectedMajor]?.courses || LEGACY_MAJOR_TRACKS[selectedMajor]?.courses || []).map(
          (c) => normalizeCode(c.course_code)
        )
      )
    : null;

  const scored = eligible
    .map((course) => {
      const code = normalizeCode(course.course_code);
      let score = 0;
      const reasons = [];

      const unlocking = calculateUnlockingPower(code, passedSet);
      if (unlocking >= 6) {
        score += unlocking * 4;
        reasons.push('Unlocks later courses');
      }

      if (course.category === COURSE_CATEGORY.CORE) {
        score += 25;
        reasons.push('Core course');
      } else if (course.category === COURSE_CATEGORY.ELECTIVE) {
        score += 5;
      }

      if (majorCodes?.has(code)) {
        score += 30;
        reasons.push(`${selectedMajor} elective`);
      }

      // Official trimester order is a soft guide, not a hard rule.
      if (course.trimester && course.trimester <= 12) {
        score += Math.max(0, 12 - course.trimester) * 3;
      }

      // Probation caps the load; a low CGPA should not add heavy courses.
      const heavy = isHeavyCourse(course);
      if (currentCgpa < 2.0 && heavy) {
        score -= 40;
      } else if (currentCgpa >= 3.5 && heavy) {
        score += 8;
      }

      return { ...course, priorityScore: score, unlockingScore: unlocking, reasons };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const basket = [];
  let currentCredits = 0;
  let heavyCount = 0;
  const heavyLimit = currentCgpa < 2.5 ? 1 : 2;

  for (const candidate of scored) {
    const credit = candidate.credit || 3;
    if (currentCredits + credit > targetCredits) continue;

    const heavy = isHeavyCourse(candidate);
    if (heavy && heavyCount >= heavyLimit) continue;

    const { conflicts } = detectExamConflicts([...basket, candidate]);
    if (conflicts.length) continue;

    basket.push(candidate);
    currentCredits += credit;
    if (heavy) heavyCount++;
    if (currentCredits >= targetCredits) break;
  }

  const { conflicts, tightExams } = detectExamConflicts(basket);

  let workloadGrade = 'Balanced';
  let workloadTone = 'ok';
  if (heavyCount >= 2 && currentCredits >= 13) {
    workloadGrade = 'Demanding';
    workloadTone = 'warn';
  } else if (currentCredits > 15) {
    workloadGrade = 'Overloaded';
    workloadTone = 'bad';
  }

  return {
    basket,
    totalCredits: currentCredits,
    heavyCourseCount: heavyCount,
    workloadGrade,
    workloadTone,
    eligibleCount: eligible.length,
    examConflicts: conflicts,
    tightExams,
    belowScholarshipFloor: currentCredits < MIN_CREDITS_PER_TRIMESTER,
    scholarshipFloor: MIN_CREDITS_PER_TRIMESTER,
  };
}

/**
 * Heavy courses, judged by credits and by being core theory courses at the
 * back end of the plan.
 */
function isHeavyCourse(course) {
  const code = normalizeCode(course.course_code);
  const heavy = new Set([
    'CSE 2217',
    'CSE 2233',
    'CSE 3313',
    'CSE 4325',
    'CSE 4509',
    'CSE 3811',
    'CSE 4889',
    'MATH 2183',
    'MATH 2205',
    'CSE 4531',
  ]);
  return heavy.has(code) || ((course.credit || 3) >= 3 && course.category === COURSE_CATEGORY.CORE);
}

/* ------------------------------------------------------------------ *
 * Full degree roadmap
 * ------------------------------------------------------------------ */

/**
 * Plan the remaining courses across the remaining trimesters.
 *
 * The plan follows the official course sequence wherever the official
 * prerequisites allow, then fills the remaining seats with electives and
 * general education optionals. It never schedules a course whose
 * prerequisites are not yet met.
 */
export function generateFullDegreeRoadmap({
  completedCourses = [],
  currentCgpa = 3.0,
  maxCreditsPerSem = 14,
  selectedMajor = 'AI & Data Science',
}) {
  const passedSet = getPassedCoursesSet(completedCourses);
  const plannedCodes = new Set(passedSet);
  const stats = computeTranscriptStats(completedCourses);
  const startSem = estimateCurrentTrimester(stats.earnedCredits);

  const planned = [];

  const majorCourses = (MAJOR_TRACKS[selectedMajor]?.courses || []).map((c) => ({
    ...c,
    category: COURSE_CATEGORY.ELECTIVE,
    group: 'Elective',
  }));

  const electivesTaken = new Set();
  const gedTaken = new Set();

  for (let sem = startSem; sem <= 12; sem++) {
    const semCourses = [];
    let semCredits = 0;

    const add = (course) => {
      const credit = course.credit || 3;
      if (semCredits + credit > maxCreditsPerSem) return false;
      semCourses.push(course);
      semCredits += credit;
      plannedCodes.add(normalizeCode(course.course_code));
      return true;
    };

    // 1. The courses the official sequence puts in this trimester.
    //    A laboratory often sits in the same trimester as its theory course,
    //    so the pool is re-scanned after every addition until it stops
    //    yielding anything. A course that does not fit this trimester is
    //    skipped for the rest of the trimester, so the scan terminates.
    const tooBigThisTerm = new Set();

    let addedOfficial = true;
    while (addedOfficial) {
      addedOfficial = false;

      const official = ALL_COURSES.filter(
        (c) =>
          c.trimester === sem &&
          !plannedCodes.has(normalizeCode(c.course_code)) &&
          !tooBigThisTerm.has(normalizeCode(c.course_code)) &&
          arePrerequisitesMet(c, plannedCodes)
      ).sort(
        (a, b) =>
          calculateUnlockingPower(b.course_code, plannedCodes) -
          calculateUnlockingPower(a.course_code, plannedCodes)
      );

      for (const course of official) {
        const code = normalizeCode(course.course_code);
        if (course.category === COURSE_CATEGORY.ELECTIVE) electivesTaken.add(code);
        if (course.category === COURSE_CATEGORY.GED) gedTaken.add(code);
        if (add(course)) {
          addedOfficial = true;
        } else {
          tooBigThisTerm.add(code);
        }
      }
    }

    // 2. Electives from the selected specialisation, then any other elective.
    //    The official sequence opens these seats in trimesters 10 to 12, so
    //    they are not pulled forward into the earlier terms.
    const electivePool =
      ELECTIVE_TRIMESTERS.includes(sem)
        ? [
            ...majorCourses.filter((c) => !plannedCodes.has(normalizeCode(c.course_code))),
            ...ALL_COURSES.filter(
              (c) =>
                c.category === COURSE_CATEGORY.ELECTIVE &&
                !plannedCodes.has(normalizeCode(c.course_code)) &&
                !majorCourses.some((m) => normalizeCode(m.course_code) === normalizeCode(c.course_code))
            ),
          ]
        : [];

    for (const course of electivePool) {
      const code = normalizeCode(course.course_code);
      if (plannedCodes.has(code)) continue;
      if (electivesTaken.size >= TOTAL_ELECTIVES_REQUIRED) break;
      if (!arePrerequisitesMet(course, plannedCodes)) continue;

      if (!add(course)) continue;
      electivesTaken.add(code);
    }

    // 3. General education optionals, three of them, also from trimester 10.
    const gedPool = GED_TRIMESTERS.includes(sem)
      ? ALL_COURSES.filter(
          (c) =>
            c.category === COURSE_CATEGORY.GED &&
            !plannedCodes.has(normalizeCode(c.course_code))
        )
      : [];

    for (const course of gedPool) {
      const code = normalizeCode(course.course_code);
      if (plannedCodes.has(code)) continue;
      if (gedTaken.size >= GED_OPTIONAL_COUNT) break;
      if (!arePrerequisitesMet(course, plannedCodes)) continue;

      if (!add(course)) continue;
      gedTaken.add(code);
    }

    if (semCourses.length) {
      planned.push({
        trimesterNum: sem,
        title: `Trimester ${sem}`,
        credits: semCredits,
        courses: semCourses,
      });
    }
  }

  return planned;
}

/* ------------------------------------------------------------------ *
 * Custom schedule auditor
 * ------------------------------------------------------------------ */

/**
 * Audit a hand-picked set of courses.
 */
export function auditCustomSchedule({
  selectedCodes = [],
  completedCourses = [],
  currentCgpa = 3.0,
}) {
  const passedSet = getPassedCoursesSet(completedCourses);
  const runningSet = getRunningCoursesSet(completedCourses);
  const validCourses = [];
  const blockedCourses = [];
  let totalCredits = 0;
  let heavyCount = 0;

  selectedCodes.forEach((rawCode) => {
    const code = normalizeCode(rawCode);
    const course = findCourse(code);

    if (!course) {
      blockedCourses.push({ code, reason: 'Not a course in the official curriculum' });
      return;
    }
    if (passedSet.has(code)) {
      blockedCourses.push({ code, course, reason: 'Already passed' });
      return;
    }
    if (runningSet.has(code)) {
      blockedCourses.push({ code, course, reason: 'Already registered this trimester' });
      return;
    }

    const missing = missingPrerequisites(course, passedSet);
    if (missing.length) {
      blockedCourses.push({
        code,
        course,
        missing,
        reason: `Missing prerequisites: ${missing.join(', ')}`,
      });
      return;
    }

    if (course.category === COURSE_CATEGORY.PROJECT) {
      const fydp = evaluateFydpEligibility({ completedCourses, currentCgpa });
      if (!fydp.eligible) {
        blockedCourses.push({
          code,
          course,
          reason:
            fydp.basis === 'credit-gate-not-met'
              ? `FYDP-I needs ${FYDP_MIN_CREDITS} completed credits. You have ${fydp.earnedCredits}.`
              : 'FYDP is restricted to 4th-year students.',
        });
        return;
      }
    }

    validCourses.push(course);
    totalCredits += course.credit || 3;
    if (isHeavyCourse(course)) heavyCount++;
  });

  const { conflicts, tightExams } = detectExamConflicts(validCourses);

  let workloadStatus = 'SAFE';
  let workloadMsg = 'Balanced load with no exam-slot collision';
  if (conflicts.length) {
    workloadStatus = 'CLASH';
    workloadMsg = 'Two courses share the same exam day and slot';
  } else if (heavyCount >= 2 && totalCredits >= 12) {
    workloadStatus = 'HEAVY';
    workloadMsg = 'Two or more heavy courses in the same trimester';
  } else if (totalCredits > 15) {
    workloadStatus = 'OVERLOAD';
    workloadMsg = 'Above the standard 15-credit load';
  }

  return {
    validCourses,
    blockedCourses,
    examConflicts: conflicts,
    tightExams,
    totalCredits,
    heavyCount,
    workloadStatus,
    workloadMsg,
    belowScholarshipFloor: totalCredits < MIN_CREDITS_PER_TRIMESTER,
    isValid: blockedCourses.length === 0 && conflicts.length === 0,
  };
}

/* ------------------------------------------------------------------ *
 * Prerequisite tree
 * ------------------------------------------------------------------ */

/**
 * Every prerequisite standing between the student and a target course.
 */
export function getPrerequisiteTree(targetCode, completedCourses = []) {
  const norm = normalizeCode(targetCode);
  const target = findCourse(norm);
  if (!target) return null;

  const passedSet = getPassedCoursesSet(completedCourses);
  const visited = new Set();
  const chain = [];

  function traverse(code, depth = 0) {
    if (visited.has(code)) return;
    visited.add(code);

    const course = findCourse(code);
    if (!course) return;

    for (const prereq of course.prerequisites || []) {
      traverse(normalizeCode(prereq), depth + 1);
    }

    if (code !== norm) {
      chain.push({
        code: course.course_code,
        name: course.course_name,
        credit: course.credit,
        isPassed: passedSet.has(code),
        depth,
      });
    }
  }

  traverse(norm, 0);

  return {
    target,
    isTargetPassed: passedSet.has(norm),
    arePrereqsMet: arePrerequisitesMet(target, passedSet),
    prerequisitesList: chain,
    missingCount: chain.filter((c) => !c.isPassed).length,
  };
}

/* ------------------------------------------------------------------ *
 * Graduation timeline
 * ------------------------------------------------------------------ */

/**
 * The graduation timeline shown in the roadmap tab.
 *
 * It wraps the deterministic progress tools and flattens them into the field
 * names the UI reads. The FYDP gate uses the official 85-credit requirement
 * from the FYDP Handbook, not the 80-credit figure the app used before.
 */
export function calculateDegreeTimeline({
  completedCourses = [],
  completedCredits = 0,
  totalDegreeCredits = DEGREE_CREDITS.current,
  currentTrimester = null,
  targetTrimester = 12,
  cgpa = null,
}) {
  const progress = evaluateDegreeProgress({
    completedCourses,
    totalDegreeCredits,
    currentTrimester,
    targetTrimester,
    cgpa,
  });

  // A transcript may be absent while a manual credit count is present.
  const safeCompleted = completedCourses.length
    ? progress.earnedCredits
    : Math.min(Number(completedCredits) || 0, totalDegreeCredits);

  const remainingCredits = Math.max(0, totalDegreeCredits - safeCompleted);
  const remainingTrimesters = Math.max(1, targetTrimester - progress.currentTrimester + 1);
  const creditsPerTermNeeded = Math.ceil(remainingCredits / remainingTrimesters);

  const paceColor =
    progress.paceTone === 'bad'
      ? 'text-red-500'
      : progress.paceTone === 'warn'
        ? 'text-amber-500'
        : 'text-ok';

  const fydpCreditsNeeded = Math.max(0, FYDP_MIN_CREDITS - safeCompleted);

  return {
    safeCompleted,
    totalDegreeCredits,
    remainingCredits,
    remainingTrimesters,
    creditsPerTermNeeded,
    paceLabel: progress.paceLabel,
    paceColor,
    currentTrimester: progress.currentTrimester,
    cgpa: progress.cgpa,
    standing: progress.standing,
    fydpEligible: progress.fydp.eligible,
    fydpBasis: progress.fydp.basis,
    creditsToFydp: fydpCreditsNeeded,
    fydpRequiredCredits: FYDP_MIN_CREDITS,
    fydpHeadline: progress.fydp.headline,
    fydpRequirements: progress.fydp.requirements,
    sources: progress.sources,
  };
}

/* ------------------------------------------------------------------ *
 * System prompt
 * ------------------------------------------------------------------ */

/**
 * The instruction block sent to every hosted model.
 */
export function buildUIUSystemPrompt(studentContext = {}) {
  const cgpa = studentContext.cgpa;
  const hasRecord = typeof cgpa === 'number' && cgpa > 0;

  return `You are the academic advisor for United International University (UIU), Dhaka.

WHAT YOU ARE ANSWERING FROM
Only the policy clauses supplied in the user message. They are transcribed from official UIU pages and carry a source link. If a question needs a rule that is not in those clauses, say the published UIU documents do not cover it and name the office that decides it. Do not supply a number, fee, deadline, threshold or date that is not in the clauses.

HOW TO WRITE
- Start with the answer. No preamble, no restating the question, no closing summary.
- Plain language, short paragraphs, bullets where they help.
- Use a table only for genuinely tabular data, such as the grading scale.
- Name the source document when you state a rule, minimum, deadline or fee.
- Do not invent deadlines for the current trimester. UIU republishes the academic calendar each trimester; point the student at the Calendar tab or the academic calendar page.

STYLE
- No hype, no encouragement padding, no emoji, no jokes, no exclamation marks, no rhetorical questions.
- No "Great question", no "Let's dive in", no summary of your own answer.
- Markdown only: bold, lists, tables. Never HTML.
- Use the second person. Be direct.

STUDENT RECORD
- CGPA: ${hasRecord ? cgpa.toFixed(2) : 'not imported'}
- Completed credits: ${studentContext.completedCredits ?? 0}
- Completed courses: ${(studentContext.completedCourseCodes || []).join(', ') || 'none imported'}
- Selected specialisation: ${studentContext.selectedMajor || 'not selected'}
- Current trimester: ${studentContext.currentTrimester ?? 'not set'}

STUDENT-SPECIFIC NUMBERS
When a question is about the student's own record, the computed tool results are authoritative. Use those figures exactly. Do not recompute them and do not soften them.`;
}

/* ------------------------------------------------------------------ *
 * Offline rule engine
 * ------------------------------------------------------------------ */

/**
 * Answer a policy question from the verified knowledge base, offline.
 *
 * The engine routes by intent, runs the matching deterministic tools, and
 * renders the answer from the retrieved clauses. It never guesses.
 */
export function generateAIAnswer(query, context = {}) {
  const q = String(query || '').toLowerCase();
  const completedCourses = context.completedCourses || [];
  const cgpa = typeof context.cgpa === 'number' ? context.cgpa : null;
  const stats = computeTranscriptStats(completedCourses);
  const earnedCredits = context.completedCredits ?? stats.earnedCredits;

  const sources = {
    probation: 'https://www.uiu.ac.bd/academics/probation-policy/',
    grading: 'https://www.uiu.ac.bd/academics/grading/',
    waiver:
      'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/scholarship-tuition-fee-and-other-fees-waiver-policy/',
    fees: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/',
    policies: 'https://www.uiu.ac.bd/academics/academic-information-policies/',
    curriculum:
      'https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2026/04/BSCSE_Curriculum__UIU_2026.pdf',
    fydp:
      'https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2025/09/FYDP_Handbookv1_FINAL.pdf',
  };

  const cite = (label, url) => `\n\n*Source: [${label}](${url})*`;

  // ---- FYDP ----
  if (/(fydp|final year design|thesis|capstone|supervisor|project\s*(i|ii|iii)\b)/.test(q)) {
    const result = evaluateFydpEligibility({
      completedCourses,
      currentTrimester: context.currentTrimester,
    });

    if (result.basis === 'already-started') {
      return `**FYDP sequence status**\n\n${result.headline}\n\n${result.requirements
        .map((r) => `- ${r}`)
        .join('\n')}${cite('FYDP Handbook v1.0', sources.fydp)}`;
    }

    return `**FYDP-I eligibility**\n\n${result.headline}\n\n- **Credit gate:** at least ${FYDP_MIN_CREDITS} credits must be completed before FYDP-I. You have ${result.earnedCredits}.\n${
      result.creditGap > 0 ? `- **Gap:** ${result.creditGap} credits still to earn.\n` : ''
    }- **Trimester:** FYDP is restricted to 4th-year students, so it opens from trimester 9.\n\n${result.requirements
      .map((r) => `- ${r}`)
      .join('\n')}${cite('FYDP Handbook v1.0', sources.fydp)}`;
  }

  // ---- Probation ----
  if (/(probation|dismissal|dismissed|suspended|low cgpa|warning letter)/.test(q)) {
    const result = evaluateProbation({ completedCourses, cgpa });
    const lines = [`**Academic probation**\n\n${result.headline}\n`];
    if (result.onProbation) {
      lines.push(`- **Credit band:** ${result.creditBand}.\n`);
      lines.push(result.actions.map((a) => `- ${a}`).join('\n'));
    } else {
      lines.push(result.actions.map((a) => `- ${a}`).join('\n'));
    }
    return lines.join('\n') + cite('UIU Probation Policy 2025', sources.probation);
  }

  // ---- Grading scale ----
  if (/(grading scale|grade scale|marks|letter grade|what is an? ?a-|what is an? ?b\+|percentage.*grade|grade.*percentage)/.test(q) && !/cgpa|honou?rs|laude/.test(q)) {
    return `**UIU grading scale**\n\n| Marks | Grade | Point | Assessment |\n| --- | --- | --- | --- |\n| 90-100 | A | 4.00 | Outstanding |\n| 86-89 | A- | 3.67 | Excellent |\n| 82-85 | B+ | 3.33 | Very Good |\n| 78-81 | B | 3.00 | Good |\n| 74-77 | B- | 2.67 | Above Average |\n| 70-73 | C+ | 2.33 | Average |\n| 66-69 | C | 2.00 | Below Average |\n| 62-65 | C- | 1.67 | Poor |\n| 58-61 | D+ | 1.33 | Very poor |\n| 55-57 | D | 1.00 | Pass |\n| 0-54 | F | 0.00 | Fail |\n\n- **Earned credit:** a course counts once you get D or above. An F does not count towards earned credits.\n- **Degree minimum:** CGPA 2.00 for undergraduate and graduate programmes.\n- **GPA:** weighted average of grade points in one trimester. **CGPA:** weighted average across all completed courses.${cite(
      'UIU Grading & Performance Evaluation',
      sources.grading
    )}`;
  }

  // ---- Retake / repeat ----
  if (/(retake|repeat|redo|resit|improve my grade|backlog|failed course|f grade)/.test(q)) {
    return `**Repeat and retake**\n\n- **Repeat:** an F in any course means you must repeat it with full tuition payment.\n- **Retake:** you may take a course again to improve a grade. Retake also carries full tuition payment.\n- **Transcript:** repeated and retaken courses appear on your transcript as 'R'.\n- **Fee:** course fee for each retake or repeat is waived by 50%, only for the first time.\n- **Scholarship:** you are not entitled to scholarship or tuition fee waiver for Repeat/Retake courses.\n- **Earned credit:** an F gives no earned credit, so you must retake that course.${cite(
      'UIU Academic Information Policies',
      sources.policies
    )}`;
  }

  // ---- Merit scholarship and waivers ----
  if (/(waiver|scholarship|merit|top 2%|next 4%|sibling|freedom fighter|waived)/.test(q)) {
    const outlook = meritScholarshipOutlook({
      termGpa: cgpa ?? 0,
      rankPercent: context.rankPercent ?? null,
    });

    const lines = [`**Merit scholarship on results**\n\n`];
    lines.push(`- **Minimum GPA:** ${MERIT_SCHOLARSHIP_GPA.toFixed(2)} in the just-previous trimester exam. Below that you are not considered at all, even inside the top 10%.\n`);
    lines.push(`- **Bands by rank in your programme:**\n  - Top 2%: 100%\n  - Next 4%: 50%\n  - Next 4%: 25%\n`);
    lines.push(`- **Credit floor:** register at least ${MIN_CREDITS_PER_TRIMESTER} credits (14 for B. Pharm) in the scholarship-receiving trimester.\n`);
    lines.push(`- **Credit parity:** you receive the scholarship for the same number of credits you earned it on. If you register more, you only get the waiver for the awarded number.\n`);
    lines.push(`- **Exclusions:** no waiver on Thesis, Project, Internship, Retake or Repeat courses.\n`);
    lines.push(`- **No stacking:** you may avail only the best one of the scholarships and waivers.\n`);
    lines.push(`- **I-grade or improvement exam:** you lose scholarship eligibility for the following trimester.\n`);
    if (cgpa != null) {
      lines.push(`\n**Your record:** CGPA ${cgpa.toFixed(2)}. ${outlook.reason}`);
    }
    return lines.join('\n') + cite(
      'UIU Scholarship, Tuition and Other Fees, Waiver Policy',
      sources.waiver
    );
  }

  // ---- Tuition and installments ----
  if (/(fee|tuition|cost|installment|per credit|payment|charge)/.test(q)) {
    const credits = context.credits ?? 12;
    const estimate = estimateTuition({
      credits,
      perCreditFee: context.perCreditFee ?? TUITION_PER_CREDIT,
      waiverRate: context.waiverRate ?? 0,
      fydpCredits: context.fydpCredits ?? 0,
      retakeCredits: context.retakeCredits ?? 0,
      transport: context.transport ?? false,
    });

    const lines = [`**Tuition and payment**\n\n`];
    lines.push(`- **Per credit:** Tk. ${TUITION_PER_CREDIT.toLocaleString('en-BD')} for BSCSE. BA English and BSSMSJ are Tk. ${TUITION_PER_CREDIT_DISCOUNTED.toLocaleString('en-BD')} per credit (15% discount).\n`);
    lines.push(`- **Trimester fee:** Tk. ${TRIMESTER_FEE.toLocaleString('en-BD')}. B. Pharm pays a semester fee of Tk. 9,750 instead.\n`);
    lines.push(`- **Formula:** credits taken x per-credit fee + trimester fee.\n`);
    lines.push(`- **At registration:** Tk. 20,000 as partial payment before course registration.\n`);
    lines.push(`- **Installments:** 40% during registration and advising, 30% before mid-term exams, 30% before final exams. Semester-based B. Pharm pays four equal 25% installments.\n`);
    lines.push(`- **Admission fee:** Tk. 20,000, non-refundable. **Caution money:** Tk. 2,000 for the ID card, refundable.\n`);
    lines.push(`- **Transportation:** Tk. 4,000 per trimester, paid in full with the first installment.\n`);
    lines.push(`\n**Estimate for ${credits} credits with no waiver: Tk. ${estimate.totalPayable.toLocaleString('en-BD')}** (tuition Tk. ${estimate.netTuition.toLocaleString('en-BD')} + trimester fee Tk. ${estimate.trimesterFee.toLocaleString('en-BD')}).\n`);
    return lines.join('\n') + cite('UIU Tuition Fees & Waivers', sources.fees);
  }

  // ---- Honours / convocation ----
  if (/(honou?rs|laude|summa|magna|convocation|gold medal)/.test(q)) {
    return `**Convocation honours**\n\nUIU does not publish the CGPA cut-offs for Summa Cum Laude, Magna Cum Laude or Cum Laude on its website, so there is no published number I can quote here.\n\n- **What is published:** the degree minimum is a final CGPA of 2.00 for undergraduate and graduate programmes.\n- **Who decides:** the Controller of Examinations sets convocation honours. Ask the Controller of Examinations' Office for the current thresholds and the medal rules for your convocation.\n- **Gold medal:** students who appear for an improvement exam may not be eligible for the Gold Medalist award.${cite(
      'UIU Grading & Performance Evaluation and Academic Information Policies',
      sources.grading
    )}`;
  }

  // ---- Attendance ----
  if (/(attendance|absent|absentee|80%|debarred)/.test(q)) {
    return `**Class attendance**\n\n- A student must attend at least **80% of classes in every course** to be eligible to sit for the final exam.\n- Attendance is part of continuous evaluation, alongside quizzes, class participation, assignment work, case study and the mid-term and final examinations.${cite(
      'UIU Academic Information Policies',
      sources.policies
    )}`;
  }

  // ---- Exam slots ----
  if (/(exam slot|exam time|exam day|clash|t1|t2|t3|exam schedule)/.test(q)) {
    return `**Final examination slots**\n\n- UIU runs three examination slots across seven exam days.\n- Each course published in the Course Offerings notice carries an **Exam Day** and an **Exam Slot**.\n- Laboratory courses show N/A for both, because they have no written final.\n- The Schedule Auditor flags two courses that share the same exam day and slot, because a candidate cannot sit two exams in one slot.\n- The day and slot assignment changes every trimester. Read the current Course Offerings and Exam Routine notices from the Department of CSE, or check the Routine tab in this app.${cite(
      'UIU CSE Course Offerings notice',
      'https://cse.uiu.ac.bd/notice/course-offerings-bscse-fall-26/'
    )}`;
  }

  // ---- Registration and minimum credits ----
  if (/(register|registration|advising|ucam|add drop|late registration|minimum credit)/.test(q)) {
    return `**Registration**\n\n- **Minimum load:** undergraduates register a minimum of 9 credits per trimester. Graduate students register a minimum of 6.\n- **Advising:** faculty advisors advise students before registration, and students should consult their advisor when planning courses.\n- **Late registration:** registering after the scheduled date needs the Head of Department's permission and a late registration fee. The calendar publishes the last day without a fine and the last day with a fine of Tk. 500.\n- **Dropping:** a course may be dropped only within the Academic Calendar date, with the Head of Department's approval. The last day to drop with a W record is on the calendar.\n- **On probation:** pre-advising and registration in UCAM stay locked and your advisor unlocks UCAM after counselling.\n- **Payment:** Tk. 20,000 is due before registration, then 40% of the rest by the first installment date.${cite(
      'UIU Academic Information Policies',
      sources.policies
    )}`;
  }

  // ---- Withdraw / incomplete ----
  if (/(withdraw|withdrawal|incomplete|\bi grade\b|grade change|drop the trimester)/.test(q)) {
    return `**Withdrawal, incomplete grade and grade change**\n\n- **W (Withdrawn):** collect the form from the Program Office, get the course teacher's endorsement and the Head of Department's approval, then submit to the Registrar's Office within 7 days of the end of Mid-Term II. Tuition is not refunded.\n- **I (Incomplete):** granted only in exceptional cases after the mid-term. You must appear in the exam within 15 days from the start of the following trimester, otherwise the I turns into an F automatically.\n- **Scholarship:** an I in a trimester makes you ineligible for any UIU scholarship in that trimester.\n- **Grade change:** apply to the Head/Director/Coordinator of the department within 1 week of the start of the following trimester.\n- **Dropping a trimester:** allowed on medical or other valid grounds. Pay 50% of tuition fee, trimester fee and transport fee. Any extra deposit is adjusted against the next trimester, never refunded.${cite(
      'UIU Academic Information Policies',
      sources.policies
    )}`;
  }

  // ---- Specialisation and tracks ----
  if (/(major|track|specialisation|specialization|elective)/.test(q)) {
    const lines = [`**Specialisation tracks**\n\n`];
    lines.push(
      `- **Current curriculum (Summer 2026 onwards):** you take five electives (15 credits) in trimesters 10 to 12. A specialisation is declared when at least **four** of them come from one area.\n`
    );
    lines.push(`- **Areas:** ${Object.keys(MAJOR_TRACKS).join(', ')}.\n`);
    lines.push(
      `- **Previous curriculum (Spring 2023 to Spring 2026):** at least **three** courses from one area, with these areas: ${Object.keys(LEGACY_MAJOR_TRACKS).join(', ')}.\n`
    );
    lines.push(`- **Industry Internship (CSE 3542):** it is an elective in every area, and you must complete all other credits before starting it.\n`);

    if (completedCourses.length) {
      const progress = evaluateElectiveProgress(completedCourses);
      lines.push(
        `\n**Your electives:** ${progress.completedCount} of ${progress.totalRequired} completed${
          progress.bestTrack && progress.bestTrack.completedCount > 0
            ? `. Strongest area: ${progress.bestTrack.name} (${progress.bestTrack.completedCount} course${progress.bestTrack.completedCount === 1 ? '' : 's'})`
            : ''
        }.`
      );
    }
    return lines.join('\n') + cite('BSCSE Curriculum, Summer 2026 onwards', sources.curriculum);
  }

  // ---- Degree credits and curriculum ----
  if (/(how many credit|total credit|degree requirement|curriculum|141|138|graduat)/.test(q)) {
    const lines = [`**B.Sc. CSE degree requirements**\n\n`];
    lines.push(`- **Current curriculum (Summer 2026 onwards):** ${DEGREE_CREDITS.current} credit hours.\n`);
    lines.push(`- **Previous curriculum (Spring 2023 to Spring 2026):** ${DEGREE_CREDITS.legacy} credit hours.\n`);
    lines.push(`- **In both:** FYDP completed with at least a C, every course passed individually, and a final CGPA of at least 2.00.\n`);
    lines.push(`- **Trimester load:** the official plan runs 9, 10, 11, 11, 13, 11, 11, 12, 13, 12, 14 and 14 credits.\n`);

    if (completedCourses.length || earnedCredits) {
      const progress = evaluateDegreeProgress({ completedCourses, cgpa });
      lines.push(
        `\n**Your record:** ${progress.earnedCredits} of ${progress.totalCredits} credits earned. ${
          progress.remainingCredits > 0
            ? `${progress.remainingCredits} credits left over ${progress.remainingTrimesters} trimester${
                progress.remainingTrimesters === 1 ? '' : 's'
              }, which needs about ${progress.creditsPerTermNeeded} credits per trimester.`
            : 'You have met the credit requirement.'
        }`
      );
    }
    return lines.join('\n') + cite('BSCSE Curriculum, Summer 2026 onwards', sources.curriculum);
  }

  // ---- Internship ----
  if (/(internship|industrial attachment|3542)/.test(q)) {
    return `**Industry Internship (CSE 3542)**\n\n- It is a 3-credit elective listed in every specialisation area of the curriculum.\n- **Prerequisite:** completion of all credits except CSE 3542. You finish your academic requirements first, then do the internship.\n- Internship credits are excluded from every scholarship and tuition fee waiver.${cite(
      'BSCSE Curriculum, Summer 2026 onwards',
      sources.curriculum
    )}`;
  }

  // ---- Degree standing of this student ----
  if (cgpa != null && cgpa < GRADUATION_CGPA_MINIMUM) {
    const result = evaluateProbation({ completedCourses, cgpa });
    return `**Academic probation**\n\n${result.headline}\n\n${result.actions
      .map((a) => `- ${a}`)
      .join('\n')}${cite('UIU Probation Policy 2025', sources.probation)}`;
  }

  // ---- Fallback: RAG over the verified knowledge base ----
  const retrieved = retrieveRelevantDocuments(query, 3);
  if (retrieved.length) {
    const body = retrieved
      .map(
        (doc) =>
          `**${doc.title}**\n${doc.summary}\n\n> ${doc.snippet.split('\n').slice(0, 4).join('\n')}\n\n*Source: [${doc.source}](${doc.url})*`
      )
      .join('\n\n---\n\n');
    return body;
  }

  return `The published UIU documents do not cover that question.\n\n${
    completedCourses.length
      ? `Your record: CGPA ${cgpa != null ? cgpa.toFixed(2) : 'not imported'}, ${earnedCredits} credits completed.\n\n`
      : 'No transcript is imported yet, so this is general policy.\n\n'
  }I can answer questions on FYDP eligibility, probation, retakes, merit waivers, tuition and installments, the grading scale, attendance, exam slots, registration rules, specialisation tracks and the degree curriculum. For anything else, the Registrar's Office and the Department of CSE publish the answer.`;
}

/* ------------------------------------------------------------------ *
 * Serverless connector
 * ------------------------------------------------------------------ */

/**
 * Ask the hosted model, grounded in the retrieved clauses and the computed
 * tool results, with a local fallback to the rule engine.

 * The engine is picked automatically: the hosted model is tried first and the
 * built-in UIU regulations engine answers when the hosted model is
 * unavailable. Students never choose a provider or a model.
 */
export async function queryUniversalAIAdvisor({
  apiKey = "[REDACTED]",
  model = '',
  prompt = '',
  studentContext = {},
  conversationHistory = [],
  bypassCache = false,
}) {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) throw new Error('Question prompt cannot be empty.');
  const startTime = Date.now();

  const retrievedSources = retrieveRelevantDocuments(cleanPrompt, 4);
  const chosenModel = model || 'auto-free';

  if (!bypassCache) {
    const cached = promptCache.get({
      prompt: cleanPrompt,
      model: chosenModel,
      provider: 'auto',
      cgpa: studentContext.cgpa,
      completedCredits: studentContext.completedCredits,
      major: studentContext.selectedMajor,
    });
    if (cached) {
      return { ...cached, retrievedSources, isClientCached: true, latencyMs: 0 };
    }
  }

  const augmentedPrompt = buildRagAugmentedPrompt({
    query: cleanPrompt,
    studentContext,
    retrievedDocs: retrievedSources,
  });

  const systemInstructions = buildUIUSystemPrompt(studentContext);

  /**
   * Ask the hosted endpoint. Returns either
   *   { ok: true, payload }  -> the live answer, or
   *   { ok: false, message } -> a neutral reason the live engine is down.
   * The endpoint answers 500 when it is not configured and 503 when every
   * upstream candidate failed, so a non-2xx response MUST be treated as a
   * failure and not silently fall through to the offline answer.
   */
  const requestHostedAnswer = async () => {
    try {
      const serverlessRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'auto',
          model: chosenModel,
          prompt: cleanPrompt,
          augmentedPrompt,
          systemInstructions,
          conversationHistory,
          studentContext,
        }),
      });

      if (!serverlessRes.ok) {
        // The request resolved, but the server reported a failure (4xx / 5xx).
        const body = await serverlessRes.json().catch(() => null);
        return {
          ok: false,
          message:
            body?.error ||
            `The online advisor is temporarily unavailable (HTTP ${serverlessRes.status}).`,
        };
      }

      const json = await serverlessRes.json();
      if (!json?.text) {
        return {
          ok: false,
          message: 'The online advisor returned an empty answer. Please try again.',
        };
      }

      return {
        ok: true,
        payload: {
          text: json.text,
          retrievedSources,
          usage: json.usage || {},
          latencyMs: json.latencyMs || Date.now() - startTime,
          isClientCached: false,
          isServerless: true,
          hostedUnavailable: false,
          hostedErrorMessage: '',
        },
      };
    } catch {
      // The hosted engine could not be reached at all (offline, DNS, CORS).
      return {
        ok: false,
        message: 'The online advisor could not be reached.',
      };
    }
  };

  const hosted = await requestHostedAnswer();

  if (hosted.ok) {
    promptCache.set(
      {
        prompt: cleanPrompt,
        model: chosenModel,
        provider: 'auto',
        cgpa: studentContext.cgpa,
        completedCredits: studentContext.completedCredits,
        major: studentContext.selectedMajor,
      },
      hosted.payload
    );

    return hosted.payload;
  }

  // The live advisor is down: answer from the built-in regulations engine and
  // tell the caller (and the UI) that this is a fallback, not a live answer.
  return {
    text: generateAIAnswer(cleanPrompt, studentContext),
    retrievedSources,
    latencyMs: Date.now() - startTime,
    isClientCached: false,
    isServerless: false,
    hostedUnavailable: true,
    hostedErrorMessage: hosted.message,
  };
}
/**
 * Follow-up questions, chosen from the intent that was just answered.
 */
export function generateFollowUpSuggestions(query = '', reply = '') {
  const q = `${query} ${reply}`.toLowerCase();
  const suggestions = [];

  if (/(fydp|thesis|capstone|project)/.test(q)) {
    suggestions.push('How many credits do I need before FYDP-I?');
    suggestions.push('What grade do I need in FYDP to graduate?');
    suggestions.push('What are the requirements for CSE 4000B?');
  } else if (/(retake|repeat|f grade|fail)/.test(q)) {
    suggestions.push('How much is the tuition fee for a retake?');
    suggestions.push('Does the old grade stay on my transcript?');
    suggestions.push('Can I retake a course if I got a B-?');
  } else if (/(waiver|scholarship|merit)/.test(q)) {
    suggestions.push('What is the minimum credit load for a scholarship?');
    suggestions.push('How much is the transportation fee?');
    suggestions.push('What happens to my scholarship if I get an I grade?');
  } else if (/(probation|dismissal)/.test(q)) {
    suggestions.push('How many probation notices can I get?');
    suggestions.push('Can I change my department while on probation?');
    suggestions.push('What is the minimum credit load on probation?');
  } else if (/(fee|tuition|installment|cost)/.test(q)) {
    suggestions.push('What are the three installment deadlines?');
    suggestions.push('What is the per-credit fee for BSCSE?');
    suggestions.push('How much is the trimester fee?');
  } else if (/(major|track|specialisation|elective)/.test(q)) {
    suggestions.push('How many electives do I need for my specialisation?');
    suggestions.push('Which courses are in the AI & Data Science area?');
    suggestions.push('Can I take electives from two different areas?');
  } else if (/(attendance|absent)/.test(q)) {
    suggestions.push('What happens if I miss the attendance requirement?');
    suggestions.push('Is attendance part of the grade?');
  } else if (/(exam slot|clash|t1|t2|t3)/.test(q)) {
    suggestions.push('How does the Schedule Auditor detect a clash?');
    suggestions.push('When is the exam routine published?');
  } else {
    suggestions.push('What are the requirements for FYDP-I?');
    suggestions.push('How does the merit scholarship work?');
    suggestions.push('What is the minimum passing grade?');
  }

  return suggestions.slice(0, 3);
}
