/**
 * EZ_UIU - Academic Advisor Engine
 *
 * Two layers:
 *
 *   1. Deterministic tools (advisorTools.js) compute every number about a
 *      student. The advisor never asks a language model to do arithmetic on a
 *      transcript.
 *   2. The serverless model (queryUniversalAIAdvisor) receives the retrieved
 *      clauses as its only policy source and the tool results as facts.
 *
 * There is no offline rule engine: every answer comes from the model, so a
 * question is never answered by canned text that could be mistaken for the
 * model's own reply.
 *
 * The prompts are deliberately flat: no cheerleading, no invented facts, no
 * filler, and an explicit instruction to say when the published UIU documents
 * do not answer the question.
 */

import {
  MAJOR_TRACKS,
  LEGACY_MAJOR_TRACKS,
  TOTAL_ELECTIVES_REQUIRED,
  ELECTIVE_TRIMESTERS,
  GED_TRIMESTERS,
  COURSE_CATEGORY,
} from '../data/advisorData';
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
 * Serverless connector
 * ------------------------------------------------------------------ */

/**
 * Ask the hosted model, grounded in the retrieved clauses and the computed
 * tool results.
 *
 * The engine is picked automatically and students never choose a provider or a
 * model. There is no offline fallback: if the hosted model cannot answer, the
 * caller is told so rather than being handed a canned reply.
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

  // The live advisor is down. There is no offline engine any more: the
  // student gets an explicit failure instead of a canned answer that looks
  // like the model said it.
  return {
    text: '',
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
