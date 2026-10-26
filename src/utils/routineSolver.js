/**
 * EZ_UIU - Routine Solver & Search Engine
 * High-performance bitmask clash-free routine combination solver.
 */

import { ROUTINE_DATA } from '../data/routineData';

export const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed'];
export const DAYS_WD = [6, 0, 1, 2, 3];
export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const COURSES = ROUTINE_DATA.courses || [];
export const SECTIONS = ROUTINE_DATA.sections || [];

export const PALETTE = [
  '#4f46e5', '#0e7490', '#047857', '#b45309', '#be123c', '#7c3aed', '#0369a1', '#4d7c0f',
  '#d97706', '#2563eb', '#059669', '#dc2626', '#9333ea', '#0891b2', '#ca8a04', '#475569'
];

export const SECTION_BY_ID = {};
export const SECTIONS_BY_CODE = {};
SECTIONS.forEach(s => {
  SECTION_BY_ID[s.id] = s;
  if (!SECTIONS_BY_CODE[s.code]) SECTIONS_BY_CODE[s.code] = [];
  SECTIONS_BY_CODE[s.code].push(s);
});

Object.keys(SECTIONS_BY_CODE).forEach(code => {
  SECTIONS_BY_CODE[code].sort((a, b) => {
    return String(a.section).localeCompare(String(b.section), undefined, { numeric: true }) ||
      (a.meetings[0] && b.meetings[0] ? a.meetings[0][1] - b.meetings[0][1] : 0);
  });
});

export const COURSE_BY_CODE = {};
COURSES.forEach(c => { COURSE_BY_CODE[c.code] = c; });

const HANDWRITTEN_ALIASES = {
  os: ['CSE 4509', 'CSE 4510'],
  dsa: ['CSE 2215', 'CSE 2216', 'CSE 2217', 'CSE 2218'],
  algo: ['CSE 2215', 'CSE 2216', 'CSE 2217', 'CSE 2218'],
  oop: ['CSE 1115', 'CSE 1116', 'CSE 2118', 'DS 1115', 'DS 1116'],
  spl: ['CSE 1111', 'CSE 1112'],
  db: ['CSE 3521', 'CSE 3522'],
  dbms: ['CSE 3521', 'CSE 3522'],
  ai: ['CSE 3811', 'CSE 3812', 'GED 1005'],
  cn: ['CSE 3711', 'CSE 3712'],
  se: ['CSE 3421', 'CSE 3422'],
  dld: ['CSE 1325', 'CSE 1326'],
  coa: ['CSE 3313'],
  ca: ['CSE 3313'],
  toc: ['CSE 2233'],
  automata: ['CSE 2233'],
  compiler: ['CSE 4611'],
  fydp: ['CSE 4000A', 'CSE 4000B', 'CSE 4000C'],
  project: ['CSE 4000A', 'CSE 4000B', 'CSE 4000C', 'DS 4000A'],
  thesis: ['CSE 4000A', 'CSE 4000B', 'CSE 4000C', 'DS 4000A'],
  capstone: ['DS 4000A'],
  sqa: ['CSE 4495'],
  stqa: ['CSE 4495'],
  testing: ['CSE 4495'],
  vlsi: ['CSE 4327'],
  hci: ['CSE 4451', 'DS 4123'],
  nlp: ['CSE 4811', 'DS 4213'],
  ml: ['CSE 4889', 'DS 4889', 'DS 4491', 'CSE 4399'],
  dl: ['CSE 4813', 'DS 4211'],
  dip: ['CSE 4883'],
  graphics: ['CSE 4883'],
  security: ['CSE 4531', 'CSE 4777', 'CSE 4125'],
  network: ['CSE 3711', 'CSE 3712', 'CSE 4777', 'CSE 4125'],
  cloud: ['CSE 4587'],
  microprocessor: ['CSE 4325', 'CSE 4326'],
  microcontroller: ['CSE 4325', 'CSE 4326'],
  web: ['CSE 4165'],
  webdev: ['CSE 4165'],
  mobile: ['CSE 4181'],
  android: ['CSE 4181'],
  dm: ['CSE 2213', 'CSE 4891'],
  ds: ['CSE 2213'],
  discrete: ['CSE 2213'],
  bds: ['BDS 1201'],
  accounting: ['ACT 2111'],
  economics: ['ECO 4101'],
};

const ALIAS_BY_COURSE = {};
Object.keys(HANDWRITTEN_ALIASES).forEach(alias => {
  HANDWRITTEN_ALIASES[alias].forEach(code => {
    if (!ALIAS_BY_COURSE[code]) ALIAS_BY_COURSE[code] = [];
    ALIAS_BY_COURSE[code].push(alias);
  });
});

function norm(s) {
  return String(s || '').replace(/&/g, ' and ').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function abbreviations(title) {
  const words = norm(title).split(' ').filter(Boolean).filter(w => {
    return ['and', 'of', 'the', 'to', 'in', 'for', 'a', 'an', 'on', 'with', 'by'].indexOf(w) === -1;
  });
  if (!words.length) return [];
  const set = {};
  set[words.map(w => w[0]).join('')] = 1;
  const nonLab = words.filter(w => w !== 'laboratory' && w !== 'lab');
  if (nonLab.length && nonLab.length < words.length) set[nonLab.map(w => w[0]).join('')] = 1;
  const last = words[words.length - 1];
  const roman = { i: '1', ii: '2', iii: '3', iv: '4' }[last];
  if (roman) {
    const base = words.slice(0, -1).map(w => w[0]).join('');
    if (base) { set[base] = 1; set[base + last] = 1; set[base + roman] = 1; }
  }
  return Object.keys(set);
}

// Pre-build search index
const countByCode = {};
const facultyByCode = {};
SECTIONS.forEach(s => {
  countByCode[s.code] = (countByCode[s.code] || 0) + 1;
  if (!facultyByCode[s.code]) facultyByCode[s.code] = [];
  if (s.faculty) facultyByCode[s.code].push(...s.faculty);
});

export const SEARCH_INDEX = COURSES.map(c => {
  const titleTokens = norm(c.title).split(' ').filter(Boolean);
  return {
    code: c.code,
    title: c.title,
    credit: c.credit,
    program: c.program,
    normCode: c.code.toLowerCase().replace(/[^a-z0-9]/g, ''),
    spaced: c.code.toLowerCase(),
    tokens: titleTokens,
    stems: titleTokens.map(t => t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t),
    abbr: abbreviations(c.title),
    aliases: ALIAS_BY_COURSE[c.code] || [],
    facultyTokens: Array.from(new Set((facultyByCode[c.code] || []).join(' ').toLowerCase().split(/\s+/).filter(Boolean))),
    count: countByCode[c.code] || 0,
  };
});

export function searchCourses(query, program = 'all') {
  const raw = String(query || '').trim();
  if (!raw) return [];
  const qNorm = norm(raw);
  const qTokens = qNorm.split(' ').filter(Boolean);
  const qCompact = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  const results = [];

  SEARCH_INDEX.forEach(e => {
    if (program !== 'all' && e.program !== program) return;

    let score = 0;
    if (e.normCode === qCompact || e.spaced === qNorm) score = 1000;
    else if (e.aliases.indexOf(qCompact) !== -1 || e.abbr.indexOf(qCompact) !== -1) score = 800;
    else if (qCompact && (e.normCode.indexOf(qCompact) === 0 || e.normCode.indexOf(qCompact) !== -1)) score = 650;
    else if (e.tokens.join(' ').indexOf(qNorm) === 0) score = 500;
    else {
      let matchedWords = 0;
      let ok = qTokens.length > 0;
      for (let i = 0; i < qTokens.length; i++) {
        const qt = qTokens[i];
        const qstem = qt.length > 3 && qt.slice(-1) === 's' ? qt.slice(0, -1) : qt;
        let hit = e.normCode.indexOf(qt) !== -1;
        for (let j = 0; !hit && j < e.tokens.length; j++) {
          if (e.tokens[j].indexOf(qt) === 0 || e.stems[j] === qstem || e.stems[j].indexOf(qstem) === 0) {
            hit = true;
            matchedWords++;
          }
        }
        if (!hit) {
          hit = e.abbr.some(a => a === qt || (qt.length >= 3 && a.indexOf(qt) === 0)) ||
            e.aliases.some(a => a === qt || (qt.length >= 3 && a.indexOf(qt) === 0));
        }
        if (!hit && qt.length >= 3) {
          hit = e.facultyTokens.some(f => f.indexOf(qt) === 0);
        }
        if (!hit) { ok = false; break; }
      }
      if (ok) score = 350 + matchedWords * 25;
    }
    if (score > 0) results.push({ entry: e, score });
  });

  results.sort((a, b) => b.score - a.score || a.entry.code.localeCompare(b.entry.code));
  return results.slice(0, 12).map(r => r.entry);
}

export function pad2(n) { return (n < 10 ? '0' : '') + n; }

export function minToHHMM(m) { return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); }

export function hhmmToMin(v) {
  const p = String(v || '').split(':').map(Number);
  if (p.length < 2 || isNaN(p[0]) || isNaN(p[1])) return null;
  return p[0] * 60 + p[1];
}

export function fmtTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return hh + ':' + pad2(m) + ' ' + ap;
}

export function sectionSummary(sec) {
  if (!sec) return '';
  const m = sec.meetings[0] || ['', 0, 0, ''];
  const days = Array.from(new Set(sec.meetings.map(x => x[0]))).join('+');
  return days + ' ' + fmtTime(m[1]) + '–' + fmtTime(m[2]) + (m[3] ? ' · Rm ' + m[3] : '') +
    (sec.faculty && sec.faculty.length ? ' · ' + sec.faculty.join(', ') : '');
}

export function overlaps(a, b) {
  return a[1] < b[2] && a[2] > b[1] && a[0] === b[0];
}

export function colourFor(keyStr) {
  let h = 0;
  for (let i = 0; i < keyStr.length; i++) h = (h * 31 + keyStr.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function scoreSchedule(sections) {
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = []; });
  let earliest = 24 * 60, latest = 0, credits = 0, tentative = 0;

  sections.forEach(sec => {
    credits += sec.credit || 0;
    if (sec.tentative) tentative++;
    (sec.meetings || []).forEach(m => {
      if (!byDay[m[0]]) byDay[m[0]] = [];
      byDay[m[0]].push(m);
      if (m[1] < earliest) earliest = m[1];
      if (m[2] > latest) latest = m[2];
    });
  });

  let gaps = 0, daysUsed = 0, earlyLate = 0;
  DAYS.forEach(d => {
    const list = byDay[d] || [];
    if (!list.length) return;
    daysUsed++;
    list.sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < list.length - 1; i++) {
      const gap = list[i + 1][1] - list[i][2];
      if (gap > 0) gaps += gap;
    }
  });

  sections.forEach(sec => {
    (sec.meetings || []).forEach(m => {
      if (m[1] <= 510) earlyLate += 10;
      if (m[2] >= 990) earlyLate += 10;
    });
  });

  if (earliest > latest) { earliest = 0; latest = 0; }

  const gapScore = Math.max(0, 100 - Math.round(gaps / 3));
  const dayScore = daysUsed <= 2 ? 100 : daysUsed === 3 ? 85 : daysUsed === 4 ? 60 : 30;
  const timeScore = Math.max(0, 100 - earlyLate);
  const tentativeScore = Math.max(0, 100 - tentative * 35);
  const total = Math.round((gapScore * 35 + dayScore * 30 + timeScore * 20 + tentativeScore * 15) / 100);

  return {
    score: total,
    credits,
    daysUsed,
    gaps,
    earliest,
    latest,
    tentative,
    gapScore,
    dayScore,
    timeScore,
  };
}

export function solveRoutine({
  selectedCourses = [],
  customCourses = [],
  daysOff = [],
  earliestTime = '',
  latestTime = '',
}) {
  if (!selectedCourses.length) {
    return { success: false, message: 'Please add at least one course to solve.', options: [] };
  }

  const earliest = earliestTime ? hhmmToMin(earliestTime) : null;
  const latest = latestTime ? hhmmToMin(latestTime) : null;
  const domains = [];
  let error = null;

  for (const sel of selectedCourses) {
    let secs = (SECTIONS_BY_CODE[sel.code] || []).slice();
    if (sel.sectionId) {
      const locked = secs.filter(s => s.id === sel.sectionId);
      if (locked.length) secs = locked;
    }
    secs = secs.filter(s => {
      return (s.meetings || []).every(m => {
        if (daysOff.indexOf(m[0]) !== -1) return false;
        if (earliest !== null && m[1] < earliest) return false;
        if (latest !== null && m[2] > latest) return false;
        return true;
      });
    });

    if (!secs.length) {
      error = `${sel.code} has no section that matches your locked section, free days, or time window.`;
      break;
    }
    domains.push({ code: sel.code, secs });
  }

  if (error) {
    return { success: false, message: error, options: [] };
  }

  domains.sort((a, b) => a.secs.length - b.secs.length);

  const fixedOcc = {};
  DAYS.forEach(d => { fixedOcc[d] = []; });
  customCourses.forEach(c => {
    (c.meetings || []).forEach(m => {
      if (fixedOcc[m[0]]) fixedOcc[m[0]].push({ start: m[1], end: m[2], title: c.title });
    });
  });

  function conflicts(occ, sec) {
    return (sec.meetings || []).some(m => {
      const list = occ[m[0]] || [];
      for (let i = 0; i < list.length; i++) {
        if (m[1] < list[i].end && m[2] > list[i].start) return true;
      }
      return false;
    });
  }

  const results = [];
  const chosen = [];
  let nodes = 0;
  let valid = 0;
  let truncated = false;
  const t0 = performance.now();
  const MAX_NODES = 220000;
  const TIME_BUDGET = 950;
  const LIMIT = 24;

  const activeOcc = {};
  DAYS.forEach(d => { activeOcc[d] = []; });

  function search(depth) {
    nodes++;
    if (nodes > MAX_NODES || ((nodes & 1023) === 0 && performance.now() - t0 > TIME_BUDGET)) {
      truncated = true;
      return;
    }
    if (depth === domains.length) {
      valid++;
      const metrics = scoreSchedule(chosen);
      results.push({ sections: chosen.slice(), metrics });
      results.sort((a, b) => b.metrics.score - a.metrics.score);
      if (results.length > LIMIT) results.length = LIMIT;
      return;
    }
    const domain = domains[depth];
    for (let i = 0; i < domain.secs.length; i++) {
      const sec = domain.secs[i];
      if (conflicts(fixedOcc, sec) || conflicts(activeOcc, sec)) continue;
      chosen.push(sec);
      const added = {};
      (sec.meetings || []).forEach(m => {
        if (!added[m[0]]) added[m[0]] = [];
        added[m[0]].push({ start: m[1], end: m[2] });
        activeOcc[m[0]].push({ start: m[1], end: m[2] });
      });
      search(depth + 1);
      Object.keys(added).forEach(d => {
        activeOcc[d].length -= added[d].length;
      });
      chosen.pop();
      if (truncated) return;
    }
  }

  search(0);

  const elapsed = Math.round(performance.now() - t0);
  if (!results.length) {
    return {
      success: false,
      message: truncated
        ? 'Search stopped before finding a clash-free combination. Try freeing a day or widening the time window.'
        : 'No clash-free combination exists for these courses. Try freeing a day, widening the time window, or changing a locked section.',
      options: [],
    };
  }

  return {
    success: true,
    message: `${results.length} option(s) found from ${valid.toLocaleString()} valid combination(s) in ${elapsed} ms.`,
    options: results,
  };
}
