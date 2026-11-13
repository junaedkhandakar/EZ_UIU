/**
 * EZ_UIU - Saved Routine & Student Profile Store
 * Manages routine synchronization, FYDP waiver rules, and batch-aware fee rates.
 */

import { matchFydpStage } from './fydp';

export const ROUTINE_STORAGE_KEY = 'ez_routine_selected';
export const STUDENT_ID_STORAGE_KEY = 'ez_student_id';

// Official UIU Final Year Design Project (FYDP) / Capstone course codes
export const FYDP_CODES = new Set([
  'CSE 4000A',
  'CSE 4000B',
  'CSE 4000C',
  'DS 4000A',
  'DS 4000B',
  'ETE 4000',
  'EEE 4000',
  'CE 4000',
]);

/**
 * Returns whether a course code is FYDP / Thesis / Capstone
 */
export function isFydpCourse(code) {
  if (!code) return false;
  const clean = String(code).trim().toUpperCase();
  return FYDP_CODES.has(clean) || /4000[A-Z]?\b/i.test(clean) || /thesis|fydp|capstone/i.test(clean);
}

/**
 * Reads the locally saved class routine (uploaded via the UCAM PDF import).
 * Returns normalized array of { code, title, section, credit, meetings, isFydp }.
 */
export function getSavedRoutine() {
  try {
    const raw = localStorage.getItem(ROUTINE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        const sec = item.customSection || item;
        if (!sec || !sec.code) return null;
        const code = String(sec.code).trim();
        return {
          code,
          title: sec.title || '',
          section: sec.section || '',
          credit: Number(sec.credit) || 3,
          meetings: Array.isArray(sec.meetings) ? sec.meetings : [],
          isFydp: isFydpCourse(code),
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Adds a FYDP / capstone course to the saved routine.
 * FYDP has no fixed class meetings, so it never appears on the routine PDF -
 * this keeps it in the student's registration so tuition counts it.
 */
export function addFydpToRoutine(stage) {
  if (!stage?.code) return getSavedRoutine();
  const routine = getSavedRoutine();
  if (routine.some((c) => matchFydpStage(c.code)?.code === stage.code)) return routine;

  const entry = {
    id: `custom-fydp-${stage.code.replace(/\s+/g, '').toUpperCase()}`,
    code: stage.code,
    title: stage.title || stage.label,
    section: '',
    credit: stage.credit || 0,
    meetings: [],
    faculty: [],
    program: 'BSCSE',
    hasLab: false,
    isFydp: true,
  };

  const next = [...routine.map(toStoredEntry), { customSection: entry }];
  try {
    localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return getSavedRoutine();
}

/**
 * Removes a FYDP / capstone course from the saved routine.
 */
export function removeFydpFromRoutine(code) {
  const routine = getSavedRoutine();
  const target = matchFydpStage(code)?.code;
  if (!target) return routine;

  const next = routine
    .filter((c) => matchFydpStage(c.code)?.code !== target)
    .map(toStoredEntry);
  try {
    localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return getSavedRoutine();
}

/**
 * Normalises a routine entry back into the stored shape (customSection wrapper).
 */
function toStoredEntry(course) {
  return {
    customSection: {
      id: course.id || `custom-${course.code}`,
      code: course.code,
      title: course.title,
      section: course.section || '',
      credit: course.credit || 0,
      meetings: course.meetings || [],
      faculty: course.faculty || [],
      program: course.program || 'BSCSE',
      hasLab: false,
    },
  };
}

/**
 * Computes summary stats for a routine
 */
export function getRoutineSummary(routine = null) {
  const list = routine || getSavedRoutine();
  const totalCourses = list.length;
  const totalCredits = list.reduce((sum, c) => sum + (c.credit || 0), 0);
  const fydpCourses = list.filter((c) => c.isFydp);
  const fydpCredits = fydpCourses.reduce((sum, c) => sum + (c.credit || 0), 0);
  const regularCredits = Math.max(0, totalCredits - fydpCredits);

  return {
    totalCourses,
    totalCredits,
    fydpCourses,
    fydpCredits,
    regularCredits,
    hasFydp: fydpCourses.length > 0,
  };
}

/**
 * Auto-detects the student's batch code (e.g. 233, 241).
 * Sources checked in priority:
 * 1. Earliest trimester code from transcript courses (e.g. '233')
 * 2. Stored student ID from routine (e.g. '0112330072' -> 233)
 * 3. Student ID in cover page form
 */
export function detectStudentBatch(courses = []) {
  // 1. From transcript: find the earliest numeric 3-digit trimester
  if (Array.isArray(courses) && courses.length > 0) {
    const terms = courses
      .map((c) => String(c.trimester || '').trim())
      .filter((t) => /^\d{3}$/.test(t))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    if (terms.length > 0) {
      const batchNum = parseInt(terms[0], 10);
      return {
        batch: terms[0],
        batchNum,
        source: 'transcript',
        firstTerm: terms[0],
      };
    }
  }

  // 2. From saved student ID
  try {
    const savedId = (localStorage.getItem(STUDENT_ID_STORAGE_KEY) || '').replace(/\D/g, '');
    const match = savedId.match(/^\d{3}(\d{3})\d{4}$/);
    if (match) {
      const b = match[1];
      return {
        batch: b,
        batchNum: parseInt(b, 10),
        source: 'routine',
        studentId: savedId,
      };
    }
  } catch {}

  // 3. From cover page draft
  try {
    const cp = JSON.parse(localStorage.getItem('ez_coverpage_form') || '{}');
    const cpId = (cp.students?.[0]?.id || '').replace(/\D/g, '');
    const match = cpId.match(/^\d{3}(\d{3})\d{4}$/);
    if (match) {
      const b = match[1];
      return {
        batch: b,
        batchNum: parseInt(b, 10),
        source: 'coverpage',
        studentId: cpId,
      };
    }
  } catch {}

  return null;
}

/**
 * Calculates UIU tuition fee per credit based on student batch policy:
 * - Batches before 241 (e.g. 233, 232, 221, etc.) -> ৳5,525
 * - Batches 241 and after (e.g. 241, 242, 251, etc.) -> ৳6,500
 * - Default fallback if unknown: ৳6,500
 */
export function getTuitionRateForBatch(batchNum) {
  if (typeof batchNum !== 'number' || isNaN(batchNum)) return 6500;
  if (batchNum < 241) return 5525;
  return 6500;
}
