/**
 * EZ_UIU - FYDP / Capstone stage detection
 *
 * FYDP has no fixed class meetings, so it rarely appears on the class routine
 * PDF even though the student is registered and paying tuition for it. This
 * module infers the likely FYDP stage from the transcript and keeps the
 * student's confirmation so Routine and Tuition always agree.
 */

import { calculateAcademicMetrics, getEffectiveCourses } from './cgpaUtils';

/**
 * Official UIU Final Year Design Project sequence (B.Sc. CSE).
 * Credit values are the single source of truth for FYDP credits.
 */
export const FYDP_STAGES = [
  { code: 'CSE 4000A', label: 'FYDP I', title: 'Final Year Design Project I', credit: 2 },
  { code: 'CSE 4000B', label: 'FYDP II', title: 'Final Year Design Project II', credit: 4 },
  { code: 'CSE 4000C', label: 'FYDP III', title: 'Final Year Design Project III', credit: 4 },
];

export const FYDP_MIN_CREDITS = 80;
export const FYDP_DECISION_KEY = 'ez_fydp_registration';

const normalize = (code) => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Maps any UIU capstone code (CSE/DS/EEE 4000A/B/C) to its FYDP stage.
 */
export function matchFydpStage(code) {
  const normalized = normalize(code);
  const match = normalized.match(/4000([ABC])?$/);
  if (!match) return null;
  const suffix = match[1] || 'A';
  return FYDP_STAGES.find((s) => s.code.endsWith(suffix)) || null;
}

const codeOf = (course) => course?.courseId || course?.courseCode || course?.code || '';

const isRunning = (course) => {
  const status = String(course?.status || '').toLowerCase();
  const grade = String(course?.grade || '').trim();
  return !grade || status.includes('running');
};

/**
 * Reads the confirmed FYDP registration decision for this browser.
 * Shape: { stages: [{ code, label, credit, title }], dismissed?: boolean }
 */
export function readFydpDecision() {
  try {
    const raw = localStorage.getItem(FYDP_DECISION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.dismissed) return { stages: [], dismissed: true };
    if (!Array.isArray(parsed.stages)) return null;
    const stages = parsed.stages
      .map((s) => {
        const stage = matchFydpStage(s.code) || FYDP_STAGES.find((x) => x.code === s.code);
        return stage ? { ...stage } : null;
      })
      .filter(Boolean);
    return stages.length ? { stages } : null;
  } catch {
    return null;
  }
}

export function writeFydpDecision(decision) {
  try {
    if (!decision) {
      localStorage.removeItem(FYDP_DECISION_KEY);
      return;
    }
    localStorage.setItem(FYDP_DECISION_KEY, JSON.stringify(decision));
  } catch {}
}

/**
 * Infers which FYDP stage(s) the student is most likely registered for.
 *
 * - A running FYDP course in the transcript is taken as the current stage.
 * - Otherwise the first stage not yet completed is the likely one, but only
 *   once the student is actually eligible (80 completed credits, or they have
 *   already started FYDP).
 */
export function inferFydp(transcriptCourses = []) {
  const list = Array.isArray(transcriptCourses) ? transcriptCourses : [];
  if (!list.length) return { completed: [], candidates: [], inferred: null, earnedCredits: 0 };

  const completed = [];
  let runningStage = null;

  list.forEach((course) => {
    const stage = matchFydpStage(codeOf(course));
    if (!stage) return;
    if (isRunning(course)) {
      if (!runningStage) runningStage = stage;
    } else if (!completed.includes(stage.label)) {
      completed.push(stage.label);
    }
  });

  const metrics = calculateAcademicMetrics(getEffectiveCourses(list));
  const earnedCredits = metrics.earnedCredits || 0;

  const remaining = FYDP_STAGES.filter((s) => !completed.includes(s.label));
  const started = completed.length > 0;

  if (runningStage) {
    return {
      completed,
      candidates: remaining.length ? remaining : [],
      inferred: runningStage,
      earnedCredits,
      basis: 'running',
    };
  }

  if (!remaining.length) {
    return { completed, candidates: [], inferred: null, earnedCredits, basis: 'complete' };
  }

  if (!started && earnedCredits < FYDP_MIN_CREDITS) {
    return { completed, candidates: remaining, inferred: null, earnedCredits, basis: 'not-eligible' };
  }

  return {
    completed,
    candidates: remaining,
    inferred: remaining[0],
    earnedCredits,
    basis: started ? 'stage-complete' : 'eligible',
  };
}

/**
 * Resolves the FYDP credits that must be counted for tuition.
 * Avoids double counting a stage that is already listed in the routine.
 */
export function resolveFydpCredits({ routine = [], decision = null } = {}) {
  const routineStages = routine.filter((c) => c.isFydp);
  const routineCodes = new Set(routineStages.map((c) => normalize(c.code)));

  let credits = routineStages.reduce((sum, c) => sum + (Number(c.credit) || 0), 0);
  const extra = [];

  (decision?.stages || []).forEach((stage) => {
    if (routineCodes.has(normalize(stage.code))) return;
    credits += stage.credit || 0;
    extra.push(stage);
  });

  return {
    credits,
    routineCredits: routineStages.reduce((sum, c) => sum + (Number(c.credit) || 0), 0),
    extraStages: extra,
    stages: [...routineStages, ...extra],
  };
}
