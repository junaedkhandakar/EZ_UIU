/**
 * EZ_UIU - Academic Intelligence & CGPA Calculation Engine
 * Strictly adhering to official United International University academic regulations.
 */

export const GRADE_POINTS = {
  'A': 4.00,
  'A-': 3.67,
  'B+': 3.33,
  'B': 3.00,
  'B-': 2.67,
  'C+': 2.33,
  'C': 2.00,
  'C-': 1.67,
  'D+': 1.33,
  'D': 1.00,
  'F': 0.00,
};

export const LETTER_GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

export const DEPT_PROFILES = {
  regular: {
    id: 'regular',
    name: 'Regular Program (CSE, BBA, EEE, etc.)',
    minCgpa: 2.00,
    defaultCredits: 138,
    curriculumOptions: [138, 141],
    defaultTuition: 6500, // Official UIU rate Tk. 6,500/credit
    trimesterFee: 6500,
    minCreditsForScholarship: 9,
    pace: 12,
  },
  pharmacy: {
    id: 'pharmacy',
    name: 'Pharmacy (B. Pharm.)',
    minCgpa: 2.50,
    defaultCredits: 165,
    curriculumOptions: [165],
    defaultTuition: 6500,
    trimesterFee: 9750, // Semester Fee for B. Pharm Tk. 9,750
    minCreditsForScholarship: 14,
    pace: 15,
  },
};

export const DEMO_TRANSCRIPT_COURSES = [];

export function formatBDT(val) {
  if (val === undefined || val === null || isNaN(val)) return '৳0';
  return '৳' + Math.round(val).toLocaleString('en-BD');
}

export function formatTrimester(term) {
  if (!term) return '—';
  const t = String(term).trim();
  if (t.length >= 3 && /^\d+$/.test(t)) {
    const yr = '20' + t.slice(0, 2);
    const semNum = t.slice(-1);
    const semMap = { '1': 'Spring', '2': 'Summer', '3': 'Fall' };
    const semName = semMap[semNum] || 'Term';
    return `${semName} ${yr} (${t})`;
  }
  return t;
}

export function nextTrimesterCode(term) {
  if (!term) return '252';
  const t = String(term).trim();
  if (t.length >= 3 && /^\d+$/.test(t)) {
    const yr = parseInt(t.slice(0, 2), 10);
    const sem = t.slice(-1);
    if (sem === '3') {
      return `${String(yr + 1).padStart(2, '0')}1`;
    }
    return `${String(yr).padStart(2, '0')}${parseInt(sem, 10) + 1}`;
  }
  return '252';
}

/**
 * Filter effective courses according to official UIU Retake Policy:
 * Only the latest completed attempt counts toward CGPA; earlier completed attempts are marked 'Replaced'.
 */
export function getEffectiveCourses(courseList, runningOverrides = {}) {
  const groups = new Map();
  courseList.forEach(c => {
    const code = (c.courseId || '').trim().toUpperCase();
    if (!code) return;
    if (!groups.has(code)) groups.set(code, []);
    
    // Check if there is a running grade projection override
    const effectiveGrade = runningOverrides[c.id] || c.grade;
    groups.get(code).push({ ...c, grade: effectiveGrade });
  });

  const effective = [];
  groups.forEach(attempts => {
    const completed = attempts.filter(a => GRADE_POINTS.hasOwnProperty(a.grade));
    if (completed.length > 0) {
      // Latest chronological attempt wins
      const sorted = completed.slice().sort((a, b) => String(b.trimester).localeCompare(String(a.trimester)));
      effective.push(sorted[0]);
    }
  });

  return effective;
}

/**
 * Compute Cumulative Academic Metrics
 */
export function calculateAcademicMetrics(courseList, runningOverrides = {}) {
  const effective = getEffectiveCourses(courseList, runningOverrides);
  let totalPoints = 0;
  let cgpaCredits = 0;
  let earnedCredits = 0;
  let failedCredits = 0;

  effective.forEach(c => {
    const pts = (GRADE_POINTS[c.grade] || 0) * (c.credit || 0);
    totalPoints += pts;
    cgpaCredits += (c.credit || 0);
    if (c.grade !== 'F' && GRADE_POINTS[c.grade] >= 1.0) {
      earnedCredits += (c.credit || 0);
    } else if (c.grade === 'F') {
      failedCredits += (c.credit || 0);
    }
  });

  const attemptedCredits = courseList
    .filter(c => {
      const g = runningOverrides[c.id] || c.grade;
      return GRADE_POINTS.hasOwnProperty(g);
    })
    .reduce((sum, c) => sum + (c.credit || 0), 0);

  const cgpa = cgpaCredits > 0 ? totalPoints / cgpaCredits : 0;

  return {
    cgpa: parseFloat(cgpa.toFixed(3)),
    credits: cgpaCredits,
    points: totalPoints,
    earnedCredits,
    attemptedCredits,
    failedCredits,
    effective,
  };
}

/**
 * Calculate historical progression per trimester
 */
export function calculateTrimesterHistory(courseList) {
  const termMap = new Map();
  courseList.forEach(c => {
    const term = (c.trimester || '').trim();
    if (!term) return;
    if (GRADE_POINTS.hasOwnProperty(c.grade)) {
      if (!termMap.has(term)) termMap.set(term, []);
      termMap.get(term).push(c);
    }
  });

  const history = [];
  const sortedTerms = Array.from(termMap.keys()).sort();

  sortedTerms.forEach(term => {
    const termCourses = termMap.get(term);
    const termCredits = termCourses.reduce((sum, c) => sum + (c.credit || 0), 0);
    const termPoints = termCourses.reduce((sum, c) => sum + (c.credit * (GRADE_POINTS[c.grade] || 0)), 0);
    const termGpa = termCredits > 0 ? termPoints / termCredits : 0;

    const coursesUpToTerm = courseList.filter(c => String(c.trimester).trim() <= term);
    const cumMetrics = calculateAcademicMetrics(coursesUpToTerm);

    history.push({
      trimester: term,
      credits: termCredits,
      points: termPoints,
      gpa: parseFloat(termGpa.toFixed(2)),
      cumulativeCGPA: cumMetrics.cgpa,
      courses: termCourses,
    });
  });

  return history;
}

/**
 * Determine In-CGPA Status for each course row
 */
export function getCourseInCgpaStatus(course, effectiveCourses, runningOverrides = {}) {
  const statusLower = (course.status || '').toLowerCase();
  const effectiveGrade = runningOverrides[course.id] || course.grade;
  const isRunning = statusLower.includes('running') || effectiveGrade === 'RUNNING' || (!effectiveGrade && !course.status);
  const isWithdrawn = effectiveGrade === 'W' || statusLower.includes('withdraw');
  const isDropped = effectiveGrade === 'Dp' || statusLower.includes('drop');

  if (isRunning || isWithdrawn || isDropped || !GRADE_POINTS.hasOwnProperty(effectiveGrade)) {
    return {
      inCgpa: false,
      label: '—',
      badgeClass: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
      reason: isRunning ? 'In Progress' : (isWithdrawn ? 'Withdrawn' : 'Dropped')
    };
  }

  const isEffective = effectiveCourses.some(eff => eff.id === course.id);
  if (isEffective) {
    return {
      inCgpa: true,
      label: 'Yes',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
      reason: 'Counts toward CGPA'
    };
  } else {
    return {
      inCgpa: false,
      label: 'Replaced',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
      reason: 'Replaced by subsequent attempt'
    };
  }
}

/**
 * Determine Honors Designation based on UIU Convocation Regulations
 */
export function getHonorsStanding(cgpa, earnedCredits, minRequiredCredits = 138) {
  if (!earnedCredits || earnedCredits === 0) {
    return {
      tier: 'No Grades Yet',
      badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
      progressPercent: 0,
      description: 'Import your UCAM grade report to compute your standing and CGPA.',
    };
  }
  if (cgpa >= 3.90) {
    return {
      tier: 'Summa Cum Laude',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      progressPercent: 100,
      description: 'Highest academic distinction (CGPA ≥ 3.90)',
    };
  } else if (cgpa >= 3.80) {
    return {
      tier: 'Magna Cum Laude',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      progressPercent: ((cgpa - 3.80) / 0.10) * 100,
      description: 'High distinction (CGPA ≥ 3.80)',
    };
  } else if (cgpa >= 3.75) {
    return {
      tier: 'Cum Laude',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      progressPercent: ((cgpa - 3.75) / 0.05) * 100,
      description: 'With distinction (CGPA ≥ 3.75)',
    };
  } else if (cgpa >= 2.00) {
    return {
      tier: 'Good Standing',
      badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
      progressPercent: ((cgpa - 2.00) / 1.75) * 100,
      description: 'Satisfactory academic standing',
    };
  } else {
    return {
      tier: 'Academic Probation',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
      progressPercent: (cgpa / 2.00) * 100,
      description: 'Below minimum CGPA threshold (CGPA < 2.00)',
    };
  }
}

/**
 * Parse UCam Grade Sheet (HTML source or copied text table)
 */
export function parseUcamSource(content) {
  if (!content || !content.trim()) throw new Error('Please paste your UCam page source or copied table');
  const trimmed = content.trim();
  const parsedCourses = [];
  let detectedDept = 'regular';

  if (trimmed.includes('<table') || trimmed.includes('ctl00_MainContainer')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'text/html');

    const progEl = doc.getElementById('ctl00_MainContainer_lblStudentProgram');
    if (progEl && /pharm/i.test(progEl.textContent || '')) detectedDept = 'pharmacy';

    let table = doc.getElementById('ctl00_MainContainer_gvRegisteredCourse');
    if (!table) {
      const tables = Array.from(doc.querySelectorAll('table'));
      for (const tbl of tables) {
        const rowText = (tbl.querySelector('tr')?.textContent || '').toLowerCase();
        if (/trimester|term/.test(rowText) && /course\s*id|code/.test(rowText) && /grade/.test(rowText)) {
          table = tbl;
          break;
        }
      }
    }

    if (!table) throw new Error('Could not find course table in UCam source. Please ensure you copied the full page source.');

    const rows = Array.from(table.querySelectorAll('tr'));
    rows.forEach(row => {
      const cells = Array.from(row.children).filter(el => el.tagName === 'TD');
      if (cells.length < 5) return;

      const getCellText = el => (el.querySelector('span')?.textContent || el.textContent || '').trim();
      const term = getCellText(cells[0]);
      if (!term || !/^\d+$/.test(term)) return;

      const cId = getCellText(cells[1]);
      const cName = getCellText(cells[2]);
      const cr = parseFloat(getCellText(cells[3])) || 3;
      const gr = getCellText(cells[4]);
      const st = cells.length >= 7 ? getCellText(cells[6]) : '';

      parsedCourses.push({
        id: 'ucam_' + Math.random().toString(36).substring(2, 9),
        trimester: term,
        courseId: cId,
        courseName: cName,
        credit: cr,
        grade: gr,
        status: st,
      });
    });
  } else {
    // Text copy fallback (tab/multispace delimited)
    const lines = trimmed.split('\n');
    lines.forEach(line => {
      const parts = line.split(/\t|\s{2,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 4 && /^\d{3}$/.test(parts[0])) {
        parsedCourses.push({
          id: 'txt_' + Math.random().toString(36).substring(2, 9),
          trimester: parts[0],
          courseId: parts[1],
          courseName: parts.length >= 5 ? parts[2] : '',
          credit: parseFloat(parts[parts.length >= 5 ? 3 : 2]) || 3,
          grade: parts[parts.length >= 5 ? 4 : 3] || '',
          status: parts[parts.length >= 6 ? 5 : 4] || '',
        });
      }
    });
  }

  if (parsedCourses.length === 0) {
    throw new Error('No courses were recognized. Please ensure you copied the grade sheet table.');
  }

  return { courses: parsedCourses, dept: detectedDept };
}

/**
 * Parse CSV Transcript
 */
export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(c => c.trim().toLowerCase());
  const termIdx = headers.findIndex(c => /mester|term/.test(c));
  const idIdx = headers.findIndex(c => /course\s*id|code/.test(c));
  const nameIdx = headers.findIndex(c => /course\s*name|title/.test(c));
  const creditIdx = headers.findIndex(c => /credit/.test(c));
  const gradeIdx = headers.findIndex(c => /grade$/.test(c) || c === 'grade');
  const statusIdx = headers.findIndex(c => /status/.test(c));

  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 2) continue;

    const trimester = (termIdx >= 0 ? cols[termIdx] : cols[0]) || '';
    const courseId = (idIdx >= 0 ? cols[idIdx] : cols[1]) || '';
    const courseName = (nameIdx >= 0 ? cols[nameIdx] : cols[2]) || '';
    const credit = Math.round(parseFloat(creditIdx >= 0 ? cols[creditIdx] : cols[3])) || 3;
    let grade = (gradeIdx >= 0 ? cols[gradeIdx] : cols[4]) || '';
    let status = (statusIdx >= 0 ? cols[statusIdx] : cols[5]) || '';

    if (status.toLowerCase().includes('running') || grade === 'RUNNING') {
      status = 'Running Course';
      grade = '';
    } else if (status.toLowerCase().includes('withdraw') || grade === 'W') {
      grade = 'W';
      status = 'Withdraw';
    } else if (status.toLowerCase().includes('drop') || grade === 'Dp') {
      grade = 'Dp';
      status = 'Dropped';
    }

    parsed.push({
      id: 'csv_' + Math.random().toString(36).substring(2, 9),
      trimester,
      courseId,
      courseName,
      credit,
      grade,
      status,
    });
  }
  return parsed;
}

/**
 * Export Courses to CSV
 */
export function exportCSV(courses) {
  if (!courses || courses.length === 0) return;
  let csv = 'Trimester,Course ID,Course Name,Credit,Grade,Point,Course Status\n';
  courses.forEach(c => {
    const pt = GRADE_POINTS[c.grade] !== undefined ? GRADE_POINTS[c.grade].toFixed(2) : '';
    csv += `"${c.trimester}","${c.courseId}","${c.courseName}",${c.credit},"${c.grade}","${pt}","${c.status || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `UIU_Academic_Transcript_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Merge newly imported courses with existing user progress.
 * Preserves user's historical trimesters and updates existing courses when matching courseId & trimester.
 */
export function mergeCourseLists(existing = [], incoming = [], mode = 'merge') {
  if (mode === 'replace') {
    return {
      merged: incoming,
      updatedCount: 0,
      addedCount: incoming.length,
    };
  }

  const existingMap = new Map();
  // Key by normalized courseId + trimester (e.g. "CSE 2213::223")
  existing.forEach((c) => {
    const key = `${(c.courseId || '').trim().toUpperCase()}::${String(c.trimester || '').trim()}`;
    existingMap.set(key, c);
  });

  let updatedCount = 0;
  let addedCount = 0;

  incoming.forEach((inc) => {
    const key = `${(inc.courseId || '').trim().toUpperCase()}::${String(inc.trimester || '').trim()}`;
    if (existingMap.has(key)) {
      // Course exists in same trimester: update grade, status, credit
      const old = existingMap.get(key);
      existingMap.set(key, {
        ...old,
        ...inc,
        id: old.id || inc.id, // preserve existing stable ID
      });
      updatedCount++;
    } else {
      // New course or new trimester: add it!
      existingMap.set(key, inc);
      addedCount++;
    }
  });

  return {
    merged: Array.from(existingMap.values()),
    updatedCount,
    addedCount,
  };
}
