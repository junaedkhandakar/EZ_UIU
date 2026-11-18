/**
 * EZ_UIU - Deterministic Academic Advisor Tools
 *
 * Every number the advisor states about a student (tuition, CGPA, probation
 * status, FYDP eligibility, specialisation progress, exam clashes) is computed
 * here from the transcript and the official UIU rules. The language model
 * never does arithmetic on a student's record - it only explains what these
 * tools have already verified.
 *
 * Every constant below is traced to an official source. The comment above
 * each block names that source so a later change can be re-checked.
 */

import {
  COURSE_CATALOG,
  GED_ELECTIVE_CODES,
  TRIMESTER_CREDIT_PLAN,
  CURRICULUM_SOURCE,
  normalizeCourseCode,
} from '../data/courseCatalog';
import {
  MAJOR_TRACKS,
  LEGACY_MAJOR_TRACKS,
  CURRENT_MAJOR_MIN_ELECTIVES,
  LEGACY_MAJOR_MIN_ELECTIVES,
  TOTAL_ELECTIVES_REQUIRED,
  INDUSTRY_INTERNSHIP,
  COURSE_REGISTRY,
  COURSE_CATEGORY,
} from '../data/advisorData';
import { GRADE_POINTS } from './cgpaUtils';

/* ------------------------------------------------------------------ *
 * Official UIU constants
 * ------------------------------------------------------------------ */

/**
 * UIU Grading & Performance Evaluation: "Degree requirements for both
 * Undergraduate and Graduate Programs: CGPA 2.00."
 * https://www.uiu.ac.bd/academics/grading/
 */
export const GRADUATION_CGPA_MINIMUM = 2.0;

/**
 * UIU Probation Policy 2025: CGPA below 2.0 places a student on probation.
 * https://www.uiu.ac.bd/academics/probation-policy/
 */
export const PROBATION_CGPA_THRESHOLD = 2.0;

/**
 * UIU Academic Information Policies: undergraduates register a minimum of
 * 9 credits per trimester, graduates a minimum of 6.
 */
export const MIN_CREDITS_PER_TRIMESTER = 9;
export const MIN_CREDITS_PER_SEMESTER_GRADUATE = 6;

/**
 * UIU Probation Policy 2025: "students on probation must register minimum two
 * courses (6 credits) in a trimester".
 */
export const PROBATION_MIN_CREDITS = 6;

/**
 * FYDP Handbook v1.0 (16 September 2025), section 2.1.1: "at least 85 Credits
 * or above must be completed before taking FYDP-I".
 */
export const FYDP_MIN_CREDITS = 85;

/**
 * FYDP Handbook v1.0: FYDP is restricted to 4th year students, which in the
 * twelve-trimester plan is trimester 9 onwards.
 */
export const FYDP_MIN_TRIMESTER = 9;

/**
 * UIU Scholarship, Tuition and Other Fees, Waiver Policy, item 04: the
 * minimum GPA to be considered for the merit scholarship is 3.50.
 */
export const MERIT_SCHOLARSHIP_GPA = 3.5;

/**
 * UIU Tuition Fees & Waivers: BSCSE per-credit fee Tk. 6,500, trimester fee
 * Tk. 6,500. BA English and BSSMSJ are Tk. 5,525 per credit (15% discount).
 */
export const TUITION_PER_CREDIT = 6500;
export const TUITION_PER_CREDIT_DISCOUNTED = 5525;
export const TRIMESTER_FEE = 6500;
export const SEMESTER_FEE = 9750;

/**
 * UIU Tuition Fees & Waivers: admission fee Tk. 20,000 (non-refundable),
 * ID card caution money Tk. 2,000 (refundable).
 */
export const ADMISSION_FEE = 20000;
export const CAUTION_MONEY = 2000;

/**
 * UIU Notice, Transportation Service: Tk. 4,000 per trimester.
 */
export const TRANSPORT_FEE = 4000;

/**
 * Scholarship bands from the official waiver policy, item 04.
 */
export const MERIT_SCHOLARSHIP_BANDS = [
  { label: 'Top 2% of the programme', rate: 1.0 },
  { label: 'Next 4% of the programme', rate: 0.5 },
  { label: 'Next 4% of the programme', rate: 0.25 },
];

/**
 * UIU Academic Information Policies: late registration fine of Tk. 500 appears
 * on every published academic calendar.
 */
export const LATE_REGISTRATION_FINE = 500;

/**
 * UIU Academic Information Policies: maximum time to complete an
 * undergraduate degree is 7 years.
 */
export const MAX_DEGREE_YEARS = 7;

export const EXAM_SLOT_ORDER = ['T1', 'T2', 'T3'];

/**
 * Total credit hours for the two published BSCSE curricula.
 */
export const DEGREE_CREDITS = {
  current: 141, // Summer 2026 onwards
  legacy: 138, // Spring 2023 to Spring 2026 and earlier
};

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * Normalise a course code: "CSE1115" / "cse 1115" -> "CSE 1115".
 *
 * The implementation lives in `courseCatalog.js` so the data layer and the
 * tools agree on one spelling of every code.
 */
export function normalizeCode(code) {
  return normalizeCourseCode(code);
}

/**
 * Every known course, keyed by normalised code.
 *
 * The registry is built once in `advisorData.js` from the official curriculum
 * sequence, the elective courses of every track and the general education
 * optionals, so the advisor tools and the advisor engine can never disagree
 * about a course's category, credit or prerequisites.
 */
export const ADVISOR_COURSE_MAP = COURSE_REGISTRY;

export const ALL_COURSES = Array.from(ADVISOR_COURSE_MAP.values());

export function findCourse(code) {
  return ADVISOR_COURSE_MAP.get(normalizeCode(code)) || null;
}

/**
 * Courses the student has passed (grade point >= 1.0, not F/W).
 */
export function getPassedCoursesSet(courseList = []) {
  const passed = new Set();
  courseList.forEach((c) => {
    const code = normalizeCode(c.courseId || c.course_code);
    const grade = String(c.grade || '').toUpperCase();
    if (!code || !grade) return;
    if (grade === 'F' || grade === 'W') return;
    if ((GRADE_POINTS[grade] || 0) >= 1.0) passed.add(code);
  });
  return passed;
}

/**
 * Courses the student is currently taking (no final grade yet).
 */
export function getRunningCoursesSet(courseList = []) {
  const running = new Set();
  courseList.forEach((c) => {
    const code = normalizeCode(c.courseId || c.course_code);
    const grade = String(c.grade || '').toUpperCase();
    const status = String(c.status || '').toLowerCase();
    if (code && (!grade || grade === 'RUNNING' || status.includes('running'))) {
      running.add(code);
    }
  });
  return running;
}

/**
 * Earned credits and CGPA from a transcript, honouring the retake rule:
 * only the latest attempt of each course counts.
 */
export function computeTranscriptStats(courseList = []) {
  const groups = new Map();
  courseList.forEach((c) => {
    const code = normalizeCode(c.courseId || c.course_code);
    if (!code) return;
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(c);
  });

  let earnedCredits = 0;
  let attemptedCredits = 0;
  let gradePoints = 0;
  let cgpaCredits = 0;
  let failedCredits = 0;
  const failedCourses = [];
  const passedCourses = [];

  groups.forEach((attempts, code) => {
    const graded = attempts.filter(
      (a) => GRADE_POINTS[String(a.grade || '').toUpperCase()] !== undefined
    );
    if (!graded.length) return;

    const sorted = graded
      .slice()
      .sort((a, b) => String(b.trimester || '').localeCompare(String(a.trimester || '')));
    const latest = sorted[0];
    const credit = latest.credit || findCourse(code)?.credit || 3;
    const points = GRADE_POINTS[String(latest.grade || '').toUpperCase()] || 0;

    attemptedCredits += credit;
    cgpaCredits += credit;
    gradePoints += points * credit;

    if (points >= 1.0) {
      earnedCredits += credit;
      passedCourses.push({ code, name: latest.courseName || code, credit, grade: latest.grade });
    } else {
      failedCredits += credit;
      failedCourses.push({ code, name: latest.courseName || code, credit });
    }
  });

  return {
    earnedCredits,
    attemptedCredits,
    failedCredits,
    cgpa: cgpaCredits > 0 ? gradePoints / cgpaCredits : 0,
    failedCourses,
    passedCourses,
  };
}

/* ------------------------------------------------------------------ *
 * Tool: CGPA projection
 * ------------------------------------------------------------------ */

/**
 * What the CGPA becomes if the student earns a given GPA next term.
 */
export function projectCgpa({
  completedCourses = [],
  currentCgpa = 0,
  nextCredits = 12,
  nextGpa = 4.0,
}) {
  const stats = computeTranscriptStats(completedCourses);
  const cgpaCredits = stats.attemptedCredits;
  const gradePoints = stats.cgpa * cgpaCredits;

  const projectedCredits = cgpaCredits + nextCredits;
  const projectedPoints = gradePoints + nextGpa * nextCredits;

  return {
    currentCgpa: Number(stats.cgpa.toFixed(2)),
    currentCredits: stats.earnedCredits,
    nextCredits,
    nextGpa,
    projectedCgpa:
      projectedCredits > 0 ? Number((projectedPoints / projectedCredits).toFixed(2)) : 0,
    projectedCredits: stats.earnedCredits + nextCredits,
    /** Credits needed at `nextGpa` to reach the 2.00 graduation minimum. */
    creditsToReachTwoAtGpa: (() => {
      if (nextGpa <= GRADUATION_CGPA_MINIMUM) return null;
      const shortfall = GRADUATION_CGPA_MINIMUM * projectedCredits - gradePoints;
      return Math.max(0, Math.ceil(shortfall / nextGpa));
    })(),
  };
}

/* ------------------------------------------------------------------ *
 * Tool: Probation status
 * ------------------------------------------------------------------ */

/**
 * Evaluate the student against the official UIU Probation Policy 2025.
 */
export function evaluateProbation({ completedCourses = [], cgpa = null }) {
  const stats = computeTranscriptStats(completedCourses);
  const currentCgpa = cgpa != null ? Number(cgpa) : stats.cgpa;
  const earned = stats.earnedCredits;

  const onProbation = currentCgpa < PROBATION_CGPA_THRESHOLD;
  const creditBand = earned >= 60 ? '60+ credits' : 'Under 60 credits';

  if (!onProbation) {
    return {
      onProbation: false,
      cgpa: Number(currentCgpa.toFixed(2)),
      earnedCredits: earned,
      status: 'CLEAR',
      headline: `CGPA ${currentCgpa.toFixed(2)} is at or above the 2.00 minimum for acceptable academic standing.`,
      actions: [
        'A term GPA of 3.50 or above is the condition for the merit scholarship.',
        'Undergraduate registration floor is 9 credits per trimester.',
      ],
      creditBand,
      sources: [
        {
          title: 'UIU Probation Policy 2025',
          url: 'https://www.uiu.ac.bd/academics/probation-policy/',
        },
      ],
    };
  }

  return {
    onProbation: true,
    cgpa: Number(currentCgpa.toFixed(2)),
    earnedCredits: earned,
    status: 'PROBATION',
    headline: `CGPA ${currentCgpa.toFixed(2)} is below the 2.00 minimum for acceptable academic standing.`,
    noticesAllowed: 3,
    creditBand,
    actions: [
      'Three consecutive probation notices are served before dismissal.',
      'A term GPA of 2.00 or more in the 3rd notice lets you continue on special consideration.',
      'If your term GPA then falls below 2.00, you are dismissed from the programme.',
      'On probation you must register at least 6 credits (two courses) per trimester. The maximum is set case by case by your programme.',
      'Pre-advising and registration in UCAM stay centrally locked. You must see your advisor, who unlocks UCAM after counselling.',
      'Department change is not allowed while on probation.',
      'You must attend all mandatory student-support programmes the university runs.',
      'A dismissed student may reapply through the regular admission test and is treated as a new student.',
    ],
    sources: [
      {
        title: 'UIU Probation Policy 2025',
        url: 'https://www.uiu.ac.bd/academics/probation-policy/',
      },
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Tool: FYDP eligibility
 * ------------------------------------------------------------------ */

/**
 * Evaluate FYDP-I eligibility against the official FYDP Handbook v1.0.
 */
export function evaluateFydpEligibility({ completedCourses = [], currentTrimester = null }) {
  const stats = computeTranscriptStats(completedCourses);
  const earned = stats.earnedCredits;
  const passed = getPassedCoursesSet(completedCourses);

  const started = ['CSE 4000A', 'CSE 4000B', 'CSE 4000C'].some((code) => passed.has(code));
  const trimester = currentTrimester || estimateCurrentTrimester(earned);

  const creditGap = Math.max(0, FYDP_MIN_CREDITS - earned);
  const yearEligible = trimester >= FYDP_MIN_TRIMESTER;

  if (started) {
    return {
      eligible: true,
      basis: 'already-started',
      earnedCredits: earned,
      creditGap: 0,
      trimester,
      headline: 'You have already started the FYDP sequence, so the FYDP-I credit gate does not apply to you.',
      requirements: [
        'CSE 4000A (FYDP-I) is a prerequisite of CSE 4000B and CSE 4000C.',
        'You must score at least a C in each of FYDP-I, FYDP-II and FYDP-III.',
        'Your group needs 3 to 5 students.',
        'Each supervisor may take a maximum of 3 new FYDP-I groups.',
      ],
      sources: [
        {
          title: 'FYDP Handbook v1.0 (16 September 2025)',
          url: 'https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2025/09/FYDP_Handbookv1_FINAL.pdf',
        },
      ],
    };
  }

  const eligible = creditGap === 0 && yearEligible;

  return {
    eligible,
    basis:
      creditGap === 0
        ? yearEligible
          ? 'credit-gate-met'
          : 'year-gate-not-met'
        : 'credit-gate-not-met',
    earnedCredits: earned,
    creditGap,
    trimester,
    requiredCredits: FYDP_MIN_CREDITS,
    headline: eligible
      ? `You have ${earned} credits, so the ${FYDP_MIN_CREDITS}-credit FYDP-I gate is met.`
      : `You need ${creditGap} more credits before you can register for FYDP-I.`,
    requirements: [
      `The FYDP Handbook requires at least ${FYDP_MIN_CREDITS} credits completed before taking FYDP-I.`,
      'FYDP is restricted to 4th-year students, so it normally opens from trimester 9.',
      'You must also have completed the core course directly related to your project area.',
      'Groups hold 3 to 5 students, and each supervisor may take a maximum of 3 new FYDP-I groups.',
      'You must score at least a C in each of FYDP-I, FYDP-II and FYDP-III.',
      'The final report is due at the end of FYDP-III, and failing to submit it results in an F.',
    ],
    sources: [
      {
        title: 'FYDP Handbook v1.0 (16 September 2025)',
        url: 'https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2025/09/FYDP_Handbookv1_FINAL.pdf',
      },
    ],
  };
}

/**
 * Estimate the current trimester from earned credits, using the official
 * trimester credit distribution for the B.Sc. CSE curriculum.
 */
export function estimateCurrentTrimester(earnedCredits = 0) {
  const officialCumulative = TRIMESTER_CREDIT_PLAN.reduce((acc, row) => {
    const total = (acc.length ? acc[acc.length - 1].cumulative : 0) + row.credits;
    return [...acc, { trimester: row.trimester, cumulative: total }];
  }, []);

  for (const row of officialCumulative) {
    if (earnedCredits < row.cumulative) return row.trimester;
  }
  return 12;
}

/* ------------------------------------------------------------------ *
 * Tool: Degree timeline
 * ------------------------------------------------------------------ */

/**
 * Graduation timeline, FYDP gate and standing projection.
 */
export function evaluateDegreeProgress({
  completedCourses = [],
  totalDegreeCredits = DEGREE_CREDITS.current,
  currentTrimester = null,
  cgpa = null,
  targetTrimester = 12,
}) {
  const stats = computeTranscriptStats(completedCourses);
  const earned = stats.earnedCredits;
  const currentCgpa = cgpa != null ? Number(cgpa) : stats.cgpa;
  const total = Number(totalDegreeCredits) || DEGREE_CREDITS.current;

  const remainingCredits = Math.max(0, total - earned);
  const trimester = currentTrimester || estimateCurrentTrimester(earned);
  const remainingTrimesters = Math.max(1, targetTrimester - trimester + 1);
  const creditsPerTermNeeded = Math.ceil(remainingCredits / remainingTrimesters);

  const fydp = evaluateFydpEligibility({
    completedCourses,
    currentTrimester: trimester,
  });

  const standing = describeStanding(currentCgpa);

  let paceLabel;
  let paceTone;
  if (remainingCredits === 0) {
    paceLabel = 'Credit requirement met';
    paceTone = 'ok';
  } else if (creditsPerTermNeeded > 15) {
    paceLabel = 'Overload risk';
    paceTone = 'bad';
  } else if (creditsPerTermNeeded > 12) {
    paceLabel = 'Above the standard load';
    paceTone = 'warn';
  } else {
    paceLabel = 'On track';
    paceTone = 'ok';
  }

  return {
    earnedCredits: earned,
    totalCredits: total,
    remainingCredits,
    currentTrimester: trimester,
    remainingTrimesters,
    creditsPerTermNeeded,
    paceLabel,
    paceTone,
    cgpa: Number(currentCgpa.toFixed(2)),
    standing,
    fydp,
    sources: [
      {
        title: CURRICULUM_SOURCE.curriculumTitle,
        url: CURRICULUM_SOURCE.curriculumUrl,
      },
      {
        title: 'FYDP Handbook v1.0',
        url: 'https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2025/09/FYDP_Handbookv1_FINAL.pdf',
      },
    ],
  };
}

/**
 * Academic standing from CGPA.
 *
 * UIU publishes the 2.00 minimum for a degree and for acceptable academic
 * standing. It does not publish convocation Latin honours thresholds, so the
 * advisor states the confirmed thresholds and names the office for the rest
 * instead of quoting numbers that are not published.
 */
export function describeStanding(cgpa) {
  const value = Number(cgpa) || 0;

  if (value >= GRADUATION_CGPA_MINIMUM) {
    return {
      tier: 'Good Standing',
      published: true,
      detail:
        'CGPA is at or above the 2.00 minimum that UIU publishes for a degree and for acceptable academic standing.',
      honours: {
        published: false,
        detail:
          'UIU does not publish the CGPA cut-offs for Summa, Magna or Cum Laude on its website. The Controller of Examinations decides convocation honours.',
      },
    };
  }

  return {
    tier: 'Academic Probation',
    published: true,
    detail:
      'CGPA is below the 2.00 minimum for acceptable academic standing, so the student is on academic probation.',
    honours: {
      published: false,
      detail:
        'UIU does not publish the CGPA cut-offs for Summa, Magna or Cum Laude on its website. The Controller of Examinations decides convocation honours.',
    },
  };
}

/* ------------------------------------------------------------------ *
 * Tool: Tuition estimate
 * ------------------------------------------------------------------ */

/**
 * Official UIU tuition for one trimester.
 *
 * @param {number} credits       credits taken in the trimester
 * @param {number} perCreditFee  Tk. 6,500 for BSCSE, Tk. 5,525 for English/MSJ
 * @param {number} waiverRate    scholarship rate 0 - 1
 * @param {number} fydpCredits   FYDP / thesis credits (never waived)
 * @param {number} retakeCredits retake / repeat credits (50% waived, first time only)
 */
export function estimateTuition({
  credits = 12,
  perCreditFee = TUITION_PER_CREDIT,
  waiverRate = 0,
  fydpCredits = 0,
  retakeCredits = 0,
  transport = false,
  semesterBased = false,
}) {
  const fee = Math.max(0, Number(perCreditFee) || 0);
  const termFee = semesterBased ? SEMESTER_FEE : TRIMESTER_FEE;

  const total = Math.max(0, Number(credits) || 0);
  const fydp = Math.min(total, Math.max(0, Number(fydpCredits) || 0));
  const retake = Math.min(total - fydp, Math.max(0, Number(retakeCredits) || 0));
  const regular = Math.max(0, total - fydp - retake);

  const baseTuition = total * fee;
  const retakeDiscount = retake * fee * 0.5;

  const rate = Math.min(1, Math.max(0, Number(waiverRate) || 0));
  // The merit scholarship is only granted when the student registers at least
  // the minimum number of credits in the trimester that carries it (9 credits
  // for undergraduates, 14 for B. Pharm). Below that floor the waiver is not
  // granted at all.
  const meetsCreditFloor = total >= MIN_CREDITS_PER_TRIMESTER;
  const scholarshipDiscount = meetsCreditFloor ? regular * fee * rate : 0;

  const netTuition = Math.max(0, baseTuition - retakeDiscount - scholarshipDiscount);
  const totalPayable = netTuition + termFee + (transport ? TRANSPORT_FEE : 0);

  const installments = semesterBased
    ? (() => {
        const each = Math.round(totalPayable / 4);
        return [
          { name: '1st Installment', percentage: '25%', amount: each, timing: 'Upon Course Registration' },
          { name: '2nd Installment', percentage: '25%', amount: each, timing: 'Before Midterm Examination' },
          { name: '3rd Installment', percentage: '25%', amount: each, timing: 'Before Final Examination' },
          { name: '4th Installment', percentage: '25%', amount: totalPayable - each * 3, timing: 'End of Semester' },
        ];
      })()
    : (() => {
        const first = Math.round(totalPayable * 0.4);
        const second = Math.round(totalPayable * 0.3);
        const third = totalPayable - first - second;
        return [
          { name: '1st Installment', percentage: '40%', amount: first, timing: 'During Course Registration / Advising' },
          { name: '2nd Installment', percentage: '30%', amount: second, timing: 'Before Midterm Examinations' },
          { name: '3rd Installment', percentage: '30%', amount: third, timing: 'Before Final Examinations' },
        ];
      })();

  return {
    credits: total,
    perCreditFee: fee,
    trimesterFee: termFee,
    transportFee: transport ? TRANSPORT_FEE : 0,
    baseTuition,
    retakeDiscount,
    scholarshipDiscount,
    netTuition,
    totalPayable,
    installments,
    fydpCredits: fydp,
    retakeCredits: retake,
    regularCredits: regular,
    /** The merit scholarship needs at least 9 credits for undergraduates. */
    meetsScholarshipCreditFloor: meetsCreditFloor,
    sources: [
      {
        title: 'UIU Tuition Fees & Waivers',
        url: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/',
      },
    ],
  };
}

/**
 * Which merit scholarship band a student with this term GPA and rank could reach.
 */
export function meritScholarshipOutlook({ termGpa = 0, rankPercent = null }) {
  if (termGpa < MERIT_SCHOLARSHIP_GPA) {
    return {
      eligible: false,
      termGpa,
      band: null,
      reason: `A term GPA of ${MERIT_SCHOLARSHIP_GPA.toFixed(2)} or above is required before the rank is even considered.`,
      bands: MERIT_SCHOLARSHIP_BANDS,
      sources: [
        {
          title: 'UIU Scholarship, Tuition and Other Fees, Waiver Policy, item 04',
          url: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/scholarship-tuition-fee-and-other-fees-waiver-policy/',
        },
      ],
    };
  }

  const band =
    rankPercent != null && rankPercent <= 2
      ? MERIT_SCHOLARSHIP_BANDS[0]
      : rankPercent != null && rankPercent <= 6
        ? MERIT_SCHOLARSHIP_BANDS[1]
        : rankPercent != null && rankPercent <= 10
          ? MERIT_SCHOLARSHIP_BANDS[2]
          : null;

  return {
    eligible: band != null,
    termGpa,
    band,
    reason: band
      ? `With a term GPA of ${termGpa.toFixed(2)}, being in the top ${rankPercent.toFixed(1)}% of the programme puts you in the ${band.label} band.`
      : `A term GPA of ${termGpa.toFixed(2)} qualifies you for consideration, but you need to be in the top 10% of the programme.`,
    bands: MERIT_SCHOLARSHIP_BANDS,
    sources: [
      {
        title: 'UIU Scholarship, Tuition and Other Fees, Waiver Policy, item 04',
        url: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/scholarship-tuition-fee-and-other-fees-waiver-policy/',
        },
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Tool: Exam clash detection
 * ------------------------------------------------------------------ */

/**
 * Detect same-day same-slot exam collisions and back-to-back slot pairs.
 */
export function detectExamConflicts(courseBasket = []) {
  const conflicts = [];
  const tightExams = [];

  for (let i = 0; i < courseBasket.length; i++) {
    for (let j = i + 1; j < courseBasket.length; j++) {
      const a = courseBasket[i];
      const b = courseBasket[j];
      if (!a.exam_day || !b.exam_day || a.exam_day !== b.exam_day) continue;
      if (!a.exam_slot || !b.exam_slot) continue;

      if (a.exam_slot === b.exam_slot) {
        conflicts.push({
          courseA: a.course_code,
          courseB: b.course_code,
          day: a.exam_day,
          slot: a.exam_slot,
          desc: `Both ${a.course_code} and ${b.course_code} have a final exam on ${a.exam_day} at slot ${a.exam_slot}`,
        });
      } else {
        const gap = Math.abs(
          EXAM_SLOT_ORDER.indexOf(a.exam_slot) - EXAM_SLOT_ORDER.indexOf(b.exam_slot)
        );
        if (gap === 1) {
          tightExams.push({
            courseA: a.course_code,
            courseB: b.course_code,
            day: a.exam_day,
            slots: `${a.exam_slot} & ${b.exam_slot}`,
            desc: `Back-to-back exams on ${a.exam_day}: ${a.course_code} (${a.exam_slot}) and ${b.exam_slot ? b.exam_slot : b.course_code}`,
          });
        }
      }
    }
  }

  return { conflicts, tightExams };
}

/* ------------------------------------------------------------------ *
 * Tool: Specialisation progress
 * ------------------------------------------------------------------ */

/**
 * How many electives a student has completed in each specialisation track.
 */
export function evaluateSpecializationProgress(completedCourses = [], requiredCount = CURRENT_MAJOR_MIN_ELECTIVES) {
  const passed = getPassedCoursesSet(completedCourses);

  const build = (tracks, curriculum) =>
    Object.entries(tracks).map(([name, track]) => {
      const completed = track.courses.filter((c) => passed.has(normalizeCode(c.course_code)));
      const needed = track.minElectives || requiredCount;
      return {
        name,
        description: track.description,
        curriculum,
        completedCount: completed.length,
        requiredCount: needed,
        completedCodes: completed.map((c) => c.course_code),
        remaining: Math.max(0, needed - completed.length),
        isComplete: completed.length >= needed,
      };
    });

  return [
    ...build(MAJOR_TRACKS, 'Summer 2026 onwards'),
    ...build(LEGACY_MAJOR_TRACKS, 'Spring 2023 - Spring 2026'),
  ];
}

/**
 * Electives the student has completed, split by how many come from each track.
 */
export function evaluateElectiveProgress(completedCourses = []) {
  const passed = getPassedCoursesSet(completedCourses);
  const completed = ALL_COURSES.filter(
    (c) => c.category === COURSE_CATEGORY.ELECTIVE && passed.has(normalizeCode(c.course_code))
  );

  const byTrack = Object.entries(MAJOR_TRACKS).map(([name, track]) => {
    const codes = track.courses
      .map((c) => normalizeCode(c.course_code))
      .filter((code) => passed.has(code));
    return {
      name,
      curriculum: track.curriculum,
      required: track.minElectives || CURRENT_MAJOR_MIN_ELECTIVES,
      completedCount: codes.length,
      completedCodes: codes,
    };
  });

  const best = byTrack.reduce(
    (acc, row) => (row.completedCount > (acc?.completedCount ?? -1) ? row : acc),
    null
  );

  return {
    totalRequired: TOTAL_ELECTIVES_REQUIRED,
    completedCount: completed.length,
    completedCodes: completed.map((c) => c.course_code),
    remainingCount: Math.max(0, TOTAL_ELECTIVES_REQUIRED - completed.length),
    byTrack,
    bestTrack: best,
    sources: [
      {
        title: CURRICULUM_SOURCE.curriculumTitle,
        url: CURRICULUM_SOURCE.curriculumUrl,
      },
    ],
  };
}

/**
 * The official general education optional list from the curriculum.
 */
export const GED_OPTIONAL_CODES = GED_ELECTIVE_CODES.map((c) => c.course_code);

/**
 * How many general education optionals the curriculum asks for: "Any three,
 * 9 credits".
 */
export const GED_OPTIONAL_COUNT = 3;

/**
 * Courses the student still has to take to finish the degree, grouped by the
 * official curriculum categories.
 */
export function remainingCurriculum(completedCourses = [], totalDegreeCredits = DEGREE_CREDITS.current) {
  const passed = getPassedCoursesSet(completedCourses);
  const stats = computeTranscriptStats(completedCourses);

  const remaining = ALL_COURSES.filter((c) => !passed.has(normalizeCode(c.course_code)));

  const byCategory = {
    Core: remaining.filter((c) => c.category === COURSE_CATEGORY.CORE),
    GeneralEducation: remaining.filter((c) => c.category === COURSE_CATEGORY.GED),
    Elective: remaining.filter((c) => c.category === COURSE_CATEGORY.ELECTIVE),
    Project: remaining.filter((c) => c.category === COURSE_CATEGORY.PROJECT),
  };

  return {
    remainingCourses: remaining,
    byCategory,
    earnedCredits: stats.earnedCredits,
    totalCredits: totalDegreeCredits,
    remainingCredits: Math.max(0, totalDegreeCredits - stats.earnedCredits),
    sources: [
      {
        title: CURRICULUM_SOURCE.curriculumTitle,
        url: CURRICULUM_SOURCE.curriculumUrl,
      },
    ],
  };
}
