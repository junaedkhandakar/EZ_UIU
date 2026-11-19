/**
 * Verification harness for the EZ_UIU academic engines.
 * Runs the pure modules directly and asserts documented behaviour.
 *
 * Run: node --experimental-loader ./scripts/extension-loader.mjs scripts/verify-engines.mjs
 */

import { calculateTuitionFees, estimateDegreeCost } from '../src/utils/tuitionUtils.js';
import { generateICS } from '../src/utils/icsGenerator.js';
import { overlaps, sectionSummary } from '../src/utils/routineSolver.js';
import { inferFydp, matchFydpStage } from '../src/utils/fydp.js';
import { CALENDARS_DATA } from '../src/data/calendarData.js';
import {
  calculateAcademicMetrics,
  calculateTrimesterHistory,
  getEffectiveCourses,
  getCourseInCgpaStatus,
  parseCSV,
  parseUcamSource,
  mergeCourseLists,
  getHonorsStanding,
  GRADE_POINTS,
} from '../src/utils/cgpaUtils.js';

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ''}`);
  }
}

console.log('\n== Tuition engine ==');

{
  const r = calculateTuitionFees({
    dept: 'regular',
    credits: 12,
    perCreditFee: 6500,
    trimesterFee: 6500,
    scholarshipRate: 0.5,
  });
  check('base tuition = credits x per-credit', r.baseTuition === 12 * 6500, `got ${r.baseTuition}`);
  check('scholarship applies to regular credits', r.scholarshipDiscount === 12 * 6500 * 0.5, `got ${r.scholarshipDiscount}`);
  check('net tuition = base - discount', r.netTuition === r.baseTuition - r.totalDiscount, `got ${r.netTuition}`);
  check('total payable adds trimester fee', r.totalPayable === r.netTuition + 6500, `got ${r.totalPayable}`);
  check('installments sum to total payable', r.installments.reduce((s, i) => s + i.amount, 0) === r.totalPayable);
  check('installments are 40/30/30', r.installments.map((i) => i.percentage).join('/') === '40%/30%/30%');
  check('meets 9-credit minimum', r.meetsMinCredits === true);
}

{
  const r = calculateTuitionFees({
    dept: 'regular',
    credits: 6,
    perCreditFee: 6500,
    trimesterFee: 6500,
    scholarshipRate: 0.5,
  });
  check('underload denies scholarship', r.scholarshipDiscount === 0, `got ${r.scholarshipDiscount}`);
  check('underload raises alert', r.underloadAlert === true);
}

{
  const r = calculateTuitionFees({
    dept: 'regular',
    credits: 12,
    perCreditFee: 6500,
    trimesterFee: 6500,
    scholarshipRate: 0,
    retakeCredits: 3,
  });
  check('retake discount is 50%', r.retakeDiscount === 3 * 6500 * 0.5, `got ${r.retakeDiscount}`);
  check('retake credits excluded from regular', r.regularCredits === 9, `got ${r.regularCredits}`);
}

{
  const r = calculateTuitionFees({
    dept: 'regular',
    credits: 12,
    perCreditFee: 6500,
    trimesterFee: 6500,
    scholarshipRate: 0.5,
    thesisCredits: 6,
  });
  check('thesis credits excluded from scholarship', r.scholarshipDiscount === 6 * 6500 * 0.5, `got ${r.scholarshipDiscount}`);
  check('thesis credits reported', r.thesisCredits === 6);
}

{
  const r = calculateTuitionFees({
    dept: 'pharmacy',
    credits: 15,
    perCreditFee: 6500,
    trimesterFee: 6500,
    scholarshipRate: 0,
  });
  check('pharmacy has 4 installments', r.installments.length === 4, `got ${r.installments.length}`);
  check('pharmacy installments sum to total', r.installments.reduce((s, i) => s + i.amount, 0) === r.totalPayable);
}

{
  const r = estimateDegreeCost({
    totalDegreeCredits: 138,
    completedCredits: 60,
    perCreditFee: 5000,
    trimesterFee: 6500,
    averageCreditsPerTerm: 12,
    averageScholarshipRate: 0,
  });
  check('remaining credits = total - completed', r.remainingCredits === 78, `got ${r.remainingCredits}`);
  check('total terms = ceil(138/12)', r.totalTerms === 12, `got ${r.totalTerms}`);
  check('completed terms = floor(60/12)', r.completedTerms === 5, `got ${r.completedTerms}`);
  check('remaining terms = 7', r.remainingTerms === 7, `got ${r.remainingTerms}`);
  check('remaining cost = total - paid', Math.abs(r.remainingCost - (r.totalEstimatedCost - r.paidCost)) < 1e-6);
}

console.log('\n== ICS export ==');

{
  const calendar = CALENDARS_DATA[0];
  check('calendar data is populated', Boolean(calendar), 'no calendars found');

  const sections = [
    {
      id: 'x1',
      code: 'CSE 2213',
      title: 'Digital Logic',
      section: 'A',
      credit: 3,
      faculty: ['Dr. X'],
      meetings: [['Sat', 600, 650, 'LT-1'], ['Tue', 600, 650, 'LT-1']],
    },
  ];

  const result = generateICS({
    sections,
    customCourses: [],
    calendar,
    firstDateStr: '2026-01-11',
    lastDateStr: '2026-04-30',
  });

  const ics = result.content;
  check('ics has BEGIN:VCALENDAR', ics.includes('BEGIN:VCALENDAR'));
  check('ics has END:VCALENDAR', ics.includes('END:VCALENDAR'));
  check('ics has VEVENT', ics.includes('BEGIN:VEVENT'));
  check('ics carries course code', ics.includes('CSE 2213'));
  check('ics uses CRLF line endings', ics.includes('\r\n'));
  check('ics has a VALARM', ics.includes('BEGIN:VALARM'));
  check('ics expands to many dated events', result.stats.classes > 20, `got ${result.stats.classes}`);
  check('ics reports a last class date', result.stats.lastClass instanceof Date);
}

{
  let threw = '';
  try {
    generateICS({ sections: [], customCourses: [], calendar: CALENDARS_DATA[0], firstDateStr: '2026-01-11', lastDateStr: '2026-04-30' });
  } catch (e) {
    threw = e.message;
  }
  check('empty routine is rejected', threw.length > 0, 'expected a throw');
}

console.log('\n== Clash detection ==');

{
  const a = ['Sat', 600, 650, 'LT-1'];
  const b = ['Sat', 630, 680, 'LT-2'];
  const backToBack = ['Sat', 650, 700, 'LT-2'];
  const otherDay = ['Sun', 600, 650, 'LT-2'];

  check('overlapping meetings clash', overlaps(a, b) === true);
  check('back-to-back meetings do not clash', overlaps(a, backToBack) === false);
  check('same time on another day does not clash', overlaps(a, otherDay) === false);
}

{
  const sec = { code: 'CSE 2213', title: 'Digital Logic', section: 'A', meetings: [['Sat', 600, 650, 'LT-1']] };
  const summary = sectionSummary(sec);
  check('section summary names the days', summary.includes('Sat'), `got ${summary}`);
  check('section summary includes the room', summary.includes('LT-1'), `got ${summary}`);
}

console.log('\n== FYDP inference ==');

{
  check('matchFydpStage recognises CSE 4000A', matchFydpStage('CSE 4000A')?.label === 'FYDP I');
  check('matchFydpStage recognises CSE 4000B', matchFydpStage('CSE 4000B')?.label === 'FYDP II');
  check('matchFydpStage recognises CSE 4000C', matchFydpStage('CSE 4000C')?.label === 'FYDP III');
  check('matchFydpStage is department agnostic', matchFydpStage('EEE 4000A')?.label === 'FYDP I');
  check('matchFydpStage ignores non-capstone codes', matchFydpStage('CSE 2213') === null);

  // Running FYDP course => that stage is the current one.
  const running = inferFydp([
    { id: '1', courseId: 'CSE 4000A', credit: 2, grade: '', status: 'Running', term: 'Spring 2026', year: 2026 },
  ]);
  check('running FYDP sets basis=running', running.basis === 'running', `got ${running.basis}`);
  check('running FYDP infers that stage', running.inferred?.label === 'FYDP I', `got ${running.inferred?.label}`);
  check('running FYDP offers one candidate', running.candidates.length === 1);

  // A completed FYDP stage is reported as completed, not as a candidate.
  const done = inferFydp([
    { id: '1', courseId: 'CSE 4000A', credit: 2, grade: 'A', status: 'Completed', term: 'Spring 2025', year: 2025 },
  ]);
  check('completed FYDP stage is recorded', done.completed.includes('FYDP I'), `got ${done.completed.join(',')}`);
  check('completed FYDP advances to the next stage', done.inferred?.label === 'FYDP II', `got ${done.inferred?.label}`);

  // Too few earned credits => no candidates.
  const early = inferFydp([
    { id: '1', courseId: 'CSE 1101', credit: 3, grade: 'A', status: 'Completed', term: 'Spring 2024', year: 2024 },
  ]);
  check('under 85 credits => not eligible', early.basis === 'not-eligible', `got ${early.basis}`);
  check('under 85 credits => no candidates', early.candidates.length === 0);

  check('inferFydp returns a shape', typeof running === 'object' && running !== null);
  check('inferFydp exposes candidates', Array.isArray(running?.candidates));
  check('inferFydp exposes completed', Array.isArray(running?.completed));
}

console.log('\n== CGPA engine ==');

{
  check('grade points: A = 4.00', GRADE_POINTS.A === 4);
  check('grade points: B+ = 3.33', GRADE_POINTS['B+'] === 3.33);
  check('grade points: C = 2.00', GRADE_POINTS.C === 2);
  check('grade points: F = 0', GRADE_POINTS.F === 0);
}

{
  // Straight pass: 3 credits A + 3 credits B = 3.50
  const m = calculateAcademicMetrics([
    { id: '1', courseId: 'CSE 1101', credit: 3, grade: 'A', trimester: 'Spring 2024', status: 'Completed' },
    { id: '2', courseId: 'CSE 1102', credit: 3, grade: 'B', trimester: 'Spring 2024', status: 'Completed' },
  ]);
  check('cgpa computed', m.cgpa === 3.5, `got ${m.cgpa}`);
  check('cgpa credits counted', m.credits === 6, `got ${m.credits}`);
  check('earned credits counted', m.earnedCredits === 6, `got ${m.earnedCredits}`);
  check('no failed credits', m.failedCredits === 0);
}

{
  // Retake: the same course failed then retaken and passed.
  // Only the latest attempt should count toward CGPA.
  const list = [
    { id: '1', courseId: 'CSE 2201', credit: 3, grade: 'F', trimester: 'Spring 2024', status: 'Completed' },
    { id: '2', courseId: 'CSE 2201', credit: 3, grade: 'A', trimester: 'Spring 2025', status: 'Completed' },
  ];
  const effective = getEffectiveCourses(list);
  check('retake keeps one effective course', effective.length === 1, `got ${effective.length}`);
  check('retake keeps the latest attempt', effective[0].grade === 'A', `got ${effective[0].grade}`);

  const m = calculateAcademicMetrics(list);
  check('retake-aware cgpa uses the passing grade', m.cgpa === 4, `got ${m.cgpa}`);
  check('retake counts credits once', m.credits === 3, `got ${m.credits}`);
  check('failed attempt still shows as attempted', m.attemptedCredits === 6, `got ${m.attemptedCredits}`);
  check('retake clears the failed-credit flag', m.failedCredits === 0, `got ${m.failedCredits}`);
}

{
  // A failing course that was never retaken.
  const m = calculateAcademicMetrics([
    { id: '1', courseId: 'CSE 2201', credit: 3, grade: 'F', trimester: 'Spring 2024', status: 'Completed' },
  ]);
  check('failed course earns no credit', m.earnedCredits === 0, `got ${m.earnedCredits}`);
  check('failed course counts as failed credits', m.failedCredits === 3, `got ${m.failedCredits}`);
  check('failed course cgpa is 0', m.cgpa === 0, `got ${m.cgpa}`);
}

{
  // A running course has no grade yet, so it must not affect the CGPA.
  const list = [
    { id: '1', courseId: 'CSE 1101', credit: 3, grade: 'A', trimester: 'Spring 2024', status: 'Completed' },
    { id: '2', courseId: 'CSE 1102', credit: 3, grade: '', trimester: 'Spring 2025', status: 'Running' },
  ];
  const m = calculateAcademicMetrics(list);
  check('running course excluded from cgpa', m.credits === 3, `got ${m.credits}`);
  check('running course excluded from earned credits', m.earnedCredits === 3, `got ${m.earnedCredits}`);

  // A projected grade override makes the running course count.
  const projected = calculateAcademicMetrics(list, { 2: 'A' });
  check('grade projection includes the running course', projected.credits === 6, `got ${projected.credits}`);
  check('grade projection updates the cgpa', projected.cgpa === 4, `got ${projected.cgpa}`);
}

{
  const list = [
    { id: '1', courseId: 'CSE 1101', credit: 3, grade: 'A', trimester: 'Spring 2024', status: 'Completed' },
    { id: '2', courseId: 'CSE 1102', credit: 3, grade: 'A', trimester: 'Spring 2025', status: 'Completed' },
    { id: '3', courseId: 'CSE 1103', credit: 3, grade: 'B', trimester: 'Spring 2025', status: 'Completed' },
  ];
  const history = calculateTrimesterHistory(list);
  check('history has one entry per term', history.length === 2, `got ${history.length}`);
  check('history is chronological', history[0].trimester === 'Spring 2024', `got ${history[0].trimester}`);
  check('term gpa computed', history[1].gpa === 3.5, `got ${history[1].gpa}`);
  check('cumulative cgpa computed', history[1].cumulativeCGPA === 3.667, `got ${history[1].cumulativeCGPA}`);
}

{
  const list = [
    { id: '1', courseId: 'CSE 2201', credit: 3, grade: 'F', trimester: 'Spring 2024', status: 'Completed' },
    { id: '2', courseId: 'CSE 2201', credit: 3, grade: 'A', trimester: 'Spring 2025', status: 'Completed' },
    { id: '3', courseId: 'CSE 2202', credit: 3, grade: '', trimester: 'Spring 2026', status: 'Running' },
  ];
  const effective = getEffectiveCourses(list);

  const replaced = getCourseInCgpaStatus(list[0], effective);
  check('older attempt marked as not in cgpa', replaced.inCgpa === false, `got ${replaced.inCgpa}`);
  check('older attempt label explains why', typeof replaced.label === 'string' && replaced.label.length > 0);

  const kept = getCourseInCgpaStatus(list[1], effective);
  check('latest attempt marked as in cgpa', kept.inCgpa === true, `got ${kept.inCgpa}`);

  const running = getCourseInCgpaStatus(list[2], effective);
  check('running course marked as not in cgpa', running.inCgpa === false, `got ${running.inCgpa}`);
  check('running course reason is In Progress', running.reason === 'In Progress', `got ${running.reason}`);
}

{
  // Honors standing thresholds.
  check('cgpa 3.75 with enough credits is a standing', getHonorsStanding(3.75, 150).tier === 'Eligible for Degree', `got ${getHonorsStanding(3.75, 150).tier}`);
  check('cgpa 3.75 without full credits is good standing', getHonorsStanding(3.75, 100).tier === 'Good Standing', `got ${getHonorsStanding(3.75, 100).tier}`);
  check('cgpa below 2.0 is academic probation', getHonorsStanding(1.8, 100).tier === 'Academic Probation', `got ${getHonorsStanding(1.8, 100).tier}`);
  check('no credits yet has no standing', getHonorsStanding(0, 0).tier === 'No Grades Yet');
}

console.log('\n== Import / export ==');

{
  const csv = 'Course Code,Course Title,Credit,Grade,Trimester\nCSE 1101,Intro to CSE,3,A,Spring 2024\nCSE 1102,Programming,3,B+,Spring 2024\n';
  const parsed = parseCSV(csv);
  check('csv parses rows', parsed.length === 2, `got ${parsed.length}`);
  check('csv maps credit', parsed[0]?.credit === 3, `got ${parsed[0]?.credit}`);
  check('csv maps grade', parsed[0]?.grade === 'A', `got ${parsed[0]?.grade}`);
  check('csv maps trimester', parsed[0]?.trimester === 'Spring 2024', `got ${parsed[0]?.trimester}`);
}

{
  // UCam text fallback: trimester code first, then course id, name, credit, grade.
  const ucam = [
    '241\tCSE 1101\tIntro to Computer Science & Engineering\t3.00\tA\tSpring 2024',
    '241\tCSE 1102\tProgramming Fundamentals\t3.00\tB+\tSpring 2024',
  ].join('\n');
  const parsed = parseUcamSource(ucam);
  check('ucam parses both courses', parsed.courses.length === 2, `got ${parsed.courses.length}`);
  check('ucam maps the course id', parsed.courses[0]?.courseId === 'CSE 1101', `got ${parsed.courses[0]?.courseId}`);
  check('ucam maps the grade', parsed.courses[0]?.grade === 'A', `got ${parsed.courses[0]?.grade}`);
  check('ucam maps the credit', parsed.courses[0]?.credit === 3, `got ${parsed.courses[0]?.credit}`);
  check('ucam maps the trimester', parsed.courses[0]?.trimester === '241', `got ${parsed.courses[0]?.trimester}`);
  check('ucam reports a department', typeof parsed.dept === 'string', `got ${parsed.dept}`);
}

{
  const a = [{ id: '1', courseId: 'CSE 1101', credit: 3, grade: 'A', trimester: '241' }];
  const b = [{ id: '2', courseId: 'CSE 1101', credit: 3, grade: 'A-', trimester: '241' }];
  const c = [{ id: '3', courseId: 'CSE 1101', credit: 3, grade: 'A', trimester: '242' }];

  const merged = mergeCourseLists(a, b, 'merge');
  check('merge dedupes by course id + trimester', merged.merged.length === 1, `got ${merged.merged.length}`);
  check('merge updates the existing row', merged.updatedCount === 1, `got ${merged.updatedCount}`);
  check('merge keeps the stable id', merged.merged[0].id === '1', `got ${merged.merged[0].id}`);
  check('merge applies the new grade', merged.merged[0].grade === 'A-', `got ${merged.merged[0].grade}`);

  const newTerm = mergeCourseLists(a, c, 'merge');
  check('a retake in a new trimester is added', newTerm.merged.length === 2, `got ${newTerm.merged.length}`);
  check('a retake in a new trimester counts as added', newTerm.addedCount === 1, `got ${newTerm.addedCount}`);

  const replaced = mergeCourseLists(a, b, 'replace');
  check('replace swaps in the incoming list', replaced.merged.length === 1 && replaced.merged[0].grade === 'A-', `got ${replaced.merged[0]?.grade}`);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);