/**
 * EZ_UIU - UIU CGPA Calculator & Academic Intelligence Engine
 * Built strictly on official United International University Academic & Financial Regulations
 */

(function () {
    'use strict';

    // Official UIU Grading Scale
    const GRADE_POINTS = {
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
        'F': 0.00
    };

    const LETTER_GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

    // Program Department Profiles
    const DEPT_PROFILES = {
        regular: {
            name: 'Regular Program (CSE, BBA, EEE, etc.)',
            minCgpa: 2.00,
            defaultCredits: 138,
            defaultTuition: 5000,
            trimesterFee: 6500,
            minCreditsForScholarship: 9,
            pace: 12
        },
        pharmacy: {
            name: 'Pharmacy (B. Pharm.)',
            minCgpa: 2.50,
            defaultCredits: 165,
            defaultTuition: 5500,
            trimesterFee: 6500,
            minCreditsForScholarship: 14,
            pace: 15
        }
    };

    // Authentic Demo Transcript with Retakes, Drops, and 2-Credit Project Course
    const DEMO_TRANSCRIPT_CSV = `Trimester,Course ID,Course Name,Credit,Grade,Point,Course Status
223,CSE 2213,Discrete Mathematics,3,D+,1.33,
223,CSE 1110,Introduction to Computer Systems,1,A,4.00,
223,ENG 1011,English I,3,C+,2.33,
223,URC 1103,Life Skills for Success,2,A,4.00,
231,CSE 1111,Structured Programming Language,3,C,2.00,
231,CSE 1112,Structured Programming Language Laboratory,1,A,4.00,
231,CSE 1325,Digital Logic Design,3,F,0.00,
231,CSE 1326,Digital Logic Design Laboratory,1,C+,2.33,
231,ENG 1013,English II,3,C,2.00,
231,BDS 1201,History of the Emergence of Bangladesh,2,A-,3.67,
232,CSE 1115,Object Oriented Programming,3,A,4.00,
232,CSE 1116,Object Oriented Programming Laboratory,1,A,4.00,
232,MATH 1151,Fundamental Calculus,3,W,0.00,Withdraw
233,CSE 2215,Data Structure and Algorithms I,3,,,Dp
233,CSE 2216,Data Structure and Algorithms I Laboratory,1,,,Dp
233,MATH 1151,Fundamental Calculus,3,,,Dp
242,CSE 1325,Digital Logic Design,3,B,3.00,
242,CSE 2215,Data Structure and Algorithms I,3,B+,3.33,
242,CSE 2216,Data Structure and Algorithms I Laboratory,1,A,4.00,
242,MATH 1151,Fundamental Calculus,3,C+,2.33,
243,CSE 2217,Data Structure and Algorithms II,3,A-,3.67,
243,CSE 2218,Data Structure and Algorithms II Laboratory,1,A-,3.67,
243,CSE 2118,Advanced Object Oriented Programming Laboratory,1,B+,3.33,
251,CSE 3521,Database Management Systems,3,,,Running Course
251,CSE 3522,Database Management Systems Laboratory,1,,,Running Course
251,CSE 4000A,Final Year Design Project - I,2,,,Running Course
251,CSE 3411,System Analysis and Design,3,,,Running Course`;

    // LocalStorage Keys
    const STORAGE_COURSES = 'ez_uiu_courses';
    const STORAGE_SETTINGS = 'ez_uiu_settings';

    // Application State
    let courses = [];
    let courseCatalog = []; // loaded from dataset/course.json
    let settings = {
        dept: 'regular',
        programCredits: 138,
        tuitionPerCredit: 5000,
        perTrimesterFee: 6500
    };
    let activeFilter = 'ALL';
    let searchQuery = '';
    let runningProjections = {}; // { courseId: grade }
    let retakeCustomTargets = {}; // { courseId: targetGrade }
    let selectedRetakeSims = new Set(); // courseIds selected in simulator

    // Format BDT Currency
    function formatBDT(val) {
        return '৳' + Math.round(val).toLocaleString('en-BD');
    }

    // Format Trimester Code (e.g. 233 -> Fall 2023, 241 -> Spring 2024)
    function formatTrimester(term) {
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

    // Advance Trimester Code Sequentially
    function nextTrimesterCode(term) {
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

    // Toast Notification Stack
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `ez-toast toast-${type}`;
        const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
        toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.2s ease';
            setTimeout(() => toast.remove(), 200);
        }, 3200);
    }

    // Load Course Catalog from dataset/course.json for Live Autocomplete
    async function loadCatalog() {
        try {
            const res = await fetch('dataset/course.json');
            if (res.ok) {
                const data = await res.json();
                courseCatalog = data.courses || [];
            }
        } catch (e) {
            console.log('Course catalog fallback active');
        }
    }

    // Calculate Effective Courses under UIU Retake Policy
    // Only the latest completed attempt counts toward CGPA; earlier completed attempts are marked 'Replaced'
    function getEffectiveCourses(courseList) {
        const groups = new Map();
        courseList.forEach(c => {
            const code = (c.courseId || '').trim().toUpperCase();
            if (!code) return;
            if (!groups.has(code)) groups.set(code, []);
            groups.get(code).push(c);
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

    // Compute Academic Standing & Metrics
    function calculateAcademicMetrics(courseList) {
        const effective = getEffectiveCourses(courseList);
        let totalPoints = 0;
        let cgpaCredits = 0;
        let earnedCredits = 0;
        let failedCredits = 0;

        effective.forEach(c => {
            const pts = GRADE_POINTS[c.grade] * c.credit;
            totalPoints += pts;
            cgpaCredits += c.credit;
            if (c.grade !== 'F' && GRADE_POINTS[c.grade] >= 1.0) {
                earnedCredits += c.credit;
            } else if (c.grade === 'F') {
                failedCredits += c.credit;
            }
        });

        const attemptedCredits = courseList
            .filter(c => GRADE_POINTS.hasOwnProperty(c.grade))
            .reduce((sum, c) => sum + (c.credit || 0), 0);

        const cgpa = cgpaCredits > 0 ? (totalPoints / cgpaCredits) : 0;

        return {
            cgpa: parseFloat(cgpa.toFixed(3)),
            credits: cgpaCredits,
            points: totalPoints,
            earnedCredits: earnedCredits,
            attemptedCredits: attemptedCredits,
            failedCredits: failedCredits,
            effective: effective
        };
    }

    // Calculate Trimester History & Progress Curves
    function calculateTrimesterHistory(courseList) {
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
            const termPoints = termCourses.reduce((sum, c) => sum + (c.credit * GRADE_POINTS[c.grade]), 0);
            const termGpa = termCredits > 0 ? (termPoints / termCredits) : 0;

            const coursesUpToTerm = courseList.filter(c => String(c.trimester).trim() <= term);
            const cumMetrics = calculateAcademicMetrics(coursesUpToTerm);

            history.push({
                trimester: term,
                credits: termCredits,
                points: termPoints,
                gpa: parseFloat(termGpa.toFixed(2)),
                cumulativeCGPA: cumMetrics.cgpa,
                courses: termCourses
            });
        });

        return history;
    }

    // Determine In-CGPA Status for each course
    function getCourseInCgpaStatus(course, allCourses, effectiveCourses) {
        const statusLower = (course.status || '').toLowerCase();
        const isRunning = statusLower.includes('running') || course.grade === 'RUNNING' || (!course.grade && !course.status);
        const isWithdrawn = course.grade === 'W' || statusLower.includes('withdraw');
        const isDropped = course.grade === 'Dp' || statusLower.includes('drop');

        if (isRunning || isWithdrawn || isDropped || !GRADE_POINTS.hasOwnProperty(course.grade)) {
            return { inCgpa: false, label: '—', reason: isRunning ? 'In Progress' : (isWithdrawn ? 'Withdrawn' : 'Dropped') };
        }

        const isEffective = effectiveCourses.some(eff => eff.id === course.id);
        if (isEffective) {
            return { inCgpa: true, label: 'Yes', reason: 'Counts in CGPA' };
        } else {
            return { inCgpa: false, label: 'Replaced', reason: 'Replaced by subsequent attempt' };
        }
    }

    // Load & Save Data
    function loadSavedData() {
        try {
            const savedCourses = localStorage.getItem(STORAGE_COURSES) || localStorage.getItem('uiu-gpa:courses');
            if (savedCourses) courses = JSON.parse(savedCourses);

            const savedSettings = localStorage.getItem(STORAGE_SETTINGS) || localStorage.getItem('uiu-gpa:settings');
            if (savedSettings) settings = Object.assign({}, settings, JSON.parse(savedSettings));
        } catch (e) {
            console.error('Error loading stored data:', e);
        }

        if (!courses || courses.length === 0) {
            courses = parseCSV(DEMO_TRANSCRIPT_CSV);
            saveData();
        }
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_COURSES, JSON.stringify(courses));
            localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }

    // CSV Parser
    function parseCSV(text) {
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
            const credit = parseFloat(creditIdx >= 0 ? cols[creditIdx] : cols[3]) || 3;
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
                id: 'course_' + Math.random().toString(36).substr(2, 9),
                trimester: trimester,
                courseId: courseId,
                courseName: courseName,
                credit: credit,
                grade: grade,
                status: status
            });
        }
        return parsed;
    }

    // UCam HTML Source Parser
    function parseUcamSource(content) {
        if (!content || !content.trim()) throw new Error('Please paste your UCam page source or copied table');
        const trimmed = content.trim();
        const parsedCourses = [];
        let detectedDept = 'regular';

        if (trimmed.includes('<table') || trimmed.includes('ctl00_MainContainer')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(trimmed, 'text/html');

            const progEl = doc.getElementById('ctl00_MainContainer_lblStudentProgram');
            if (progEl && /pharm/i.test(progEl.textContent)) detectedDept = 'pharmacy';

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

            if (!table) throw new Error('Could not find course table in UCam source. Make sure you copied the full page source.');

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
                    id: 'ucam_' + Math.random().toString(36).substr(2, 9),
                    trimester: term,
                    courseId: cId,
                    courseName: cName,
                    credit: cr,
                    grade: gr,
                    status: st
                });
            });
        } else {
            // Text copy fallback
            const lines = trimmed.split('\n');
            lines.forEach(line => {
                const parts = line.split(/\t|\s{2,}/).map(p => p.trim()).filter(Boolean);
                if (parts.length >= 4 && /^\d{3}$/.test(parts[0])) {
                    parsedCourses.push({
                        id: 'text_' + Math.random().toString(36).substr(2, 9),
                        trimester: parts[0],
                        courseId: parts[1],
                        courseName: parts.length >= 5 ? parts[2] : '',
                        credit: parseFloat(parts[parts.length >= 5 ? 3 : 2]) || 3,
                        grade: parts[parts.length >= 5 ? 4 : 3] || '',
                        status: parts[parts.length >= 6 ? 5 : 4] || ''
                    });
                }
            });
        }

        if (parsedCourses.length === 0) {
            throw new Error('No courses were recognized. Please ensure you copied the grade sheet table.');
        }

        return { courses: parsedCourses, dept: detectedDept };
    }

    // Export CSV
    function exportCSV() {
        if (!courses || courses.length === 0) {
            showToast('No courses to export', 'error');
            return;
        }

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
        showToast('Transcript exported as CSV', 'success');
    }

    // Render Dashboard Tab (Hero Gauge, KPIs, and Visual Performance Curve)
    function renderDashboard() {
        const metrics = calculateAcademicMetrics(courses);
        const history = calculateTrimesterHistory(courses);
        const deptConfig = DEPT_PROFILES[settings.dept] || DEPT_PROFILES.regular;
        const minCgpa = deptConfig.minCgpa;
        const isOnProbation = metrics.cgpa < minCgpa && metrics.credits > 0;

        // 1. CGPA Radial Gauge + headline numbers
        document.getElementById('dashCgpa').textContent = metrics.cgpa.toFixed(2);
        document.getElementById('dashEarnedCredits').textContent = metrics.earnedCredits;

        const gaugeArc = document.getElementById('cgpaGaugeArc');
        const circumference = 427.26; // 2 * pi * 68
        const progress = Math.min(1, Math.max(0, metrics.cgpa / 4.00));
        const offset = circumference * (1 - progress);
        gaugeArc.style.strokeDashoffset = offset;

        // Draw gauge tick marks (0..4 in 0.5 steps) as a static overlay
        const ticksGroup = document.getElementById('gaugeTicks');
        if (ticksGroup) {
            const cx = 80, cy = 80, rOuter = 57, lenMinor = 4, lenMajor = 7;
            let ticksSvg = '';
            for (let t = 0; t <= 4; t += 0.5) {
                const frac = t / 4;
                const ang = frac * 2 * Math.PI; // 0 at top (svg unrotated)
                const isMajor = Number.isInteger(t);
                const r1 = rOuter;
                const r2 = rOuter - (isMajor ? lenMajor : lenMinor);
                const x1 = cx + r1 * Math.cos(ang - Math.PI / 2);
                const y1 = cy + r1 * Math.sin(ang - Math.PI / 2);
                const x2 = cx + r2 * Math.cos(ang - Math.PI / 2);
                const y2 = cy + r2 * Math.sin(ang - Math.PI / 2);
                ticksSvg += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="var(--ez-text-4)" stroke-width="${isMajor ? 1.6 : 1}" stroke-linecap="round" opacity="${isMajor ? 0.75 : 0.4}"/>`;
            }
            ticksGroup.innerHTML = ticksSvg;
        }

        const standingBadge = document.getElementById('dashStandingBadge');
        const honorsGap = document.getElementById('dashHonorsGap');

        if (metrics.credits === 0) {
            standingBadge.textContent = 'No Data';
            standingBadge.className = 'ez-gauge-tier-pill';
            gaugeArc.style.stroke = 'var(--ez-border)';
            honorsGap.textContent = 'Add courses to calculate standing';
        } else if (isOnProbation) {
            standingBadge.textContent = 'Academic Probation';
            standingBadge.className = 'ez-gauge-tier-pill tier-probation';
            gaugeArc.style.stroke = 'var(--ez-danger)';
            honorsGap.innerHTML = `<span style="color: var(--ez-danger); font-weight: 600;">${(minCgpa - metrics.cgpa).toFixed(2)} points below min threshold</span>`;
        } else if (metrics.cgpa >= 3.75) {
            standingBadge.textContent = "Summa Cum Laude · Dean's List";
            standingBadge.className = 'ez-gauge-tier-pill tier-outstanding';
            gaugeArc.style.stroke = 'var(--ez-success)';
            honorsGap.textContent = 'Highest Academic Distinction';
        } else if (metrics.cgpa >= 3.50) {
            standingBadge.textContent = 'Magna Cum Laude';
            standingBadge.className = 'ez-gauge-tier-pill tier-first-class';
            gaugeArc.style.stroke = 'var(--ez-accent)';
            honorsGap.textContent = `${(3.75 - metrics.cgpa).toFixed(2)} points to Dean's List (3.75)`;
        } else if (metrics.cgpa >= 3.00) {
            standingBadge.textContent = 'Cum Laude · Good Standing';
            standingBadge.className = 'ez-gauge-tier-pill tier-good';
            gaugeArc.style.stroke = 'var(--ez-primary)';
            honorsGap.textContent = `${(3.50 - metrics.cgpa).toFixed(2)} points to Magna Cum Laude (3.50)`;
        } else {
            standingBadge.textContent = 'Passing Academic Standing';
            standingBadge.className = 'ez-gauge-tier-pill tier-pass';
            gaugeArc.style.stroke = 'var(--ez-warning)';
            honorsGap.textContent = `${(3.00 - metrics.cgpa).toFixed(2)} points to Good Standing (3.00)`;
        }

        // 2. Credits Earned
        document.getElementById('dashEarnedCredits').textContent = metrics.earnedCredits;
        document.getElementById('dashAttemptedSub').textContent = `${metrics.attemptedCredits} attempted · ${metrics.credits} counted`;

        // 3. Latest Term GPA & Velocity
        if (history.length > 0) {
            const latest = history[history.length - 1];
            document.getElementById('dashLatestGpa').textContent = latest.gpa.toFixed(2);
            if (history.length > 1) {
                const prev = history[history.length - 2];
                const delta = latest.gpa - prev.gpa;
                const sign = delta >= 0 ? '+' : '';
                document.getElementById('dashTermDelta').innerHTML = `
                    <span style="font-weight: 600; color: ${delta >= 0 ? 'var(--ez-success)' : 'var(--ez-danger)'};">
                        ${sign}${delta.toFixed(2)}
                    </span> vs previous trimester`;
            } else {
                document.getElementById('dashTermDelta').textContent = formatTrimester(latest.trimester);
            }
        } else {
            document.getElementById('dashLatestGpa').textContent = '—';
            document.getElementById('dashTermDelta').textContent = 'No term history';
        }

        // 4. Mandatory Retakes
        const failedCount = metrics.effective.filter(c => c.grade === 'F').length;
        document.getElementById('dashFailedCount').textContent = failedCount;
        document.getElementById('dashFailedSub').textContent = failedCount === 0 ? 'No failed courses' : 'F grades must be cleared';

        // 5. Probation Recovery Trigger
        const probationAlert = document.getElementById('dashboardProbationAlert');
        const recoveryTabBtn = document.getElementById('tabRecoveryBtn');
        if (isOnProbation) {
            probationAlert.style.display = 'flex';
            document.getElementById('dashboardProbationText').textContent =
                `Your CGPA (${metrics.cgpa.toFixed(2)}) is below UIU's minimum threshold of ${minCgpa.toFixed(2)} (${deptConfig.name}). Plan retakes now to recover standing.`;
            recoveryTabBtn.style.display = 'inline-flex';
        } else {
            probationAlert.style.display = 'none';
            recoveryTabBtn.style.display = 'none';
        }

        // 6. Dock Badges
        document.getElementById('coursesCountBadge').textContent = courses.length;
        const runningCourses = courses.filter(c => (c.status || '').toLowerCase().includes('running') || c.grade === 'RUNNING');
        const runningBadge = document.getElementById('runningCountBadge');
        if (runningCourses.length > 0) {
            runningBadge.textContent = runningCourses.length;
            runningBadge.style.display = 'inline-flex';
        } else {
            runningBadge.style.display = 'none';
        }

        // 7. Course Summary text
        document.getElementById('dashCoursesSummary').textContent =
            `${courses.length} courses logged · ${metrics.effective.length} counted in CGPA · ${runningCourses.length} in progress.`;

        // 8. Render Visual Curve
        renderTrimesterChart(history, minCgpa);
    }

    // Render Visual Performance Curve SVG
    function renderTrimesterChart(history, minCgpa) {
        const wrap = document.getElementById('chartSvgWrap');
        if (!history || history.length === 0) {
            wrap.innerHTML = `
                <div class="ez-chart-empty">
                    <i class="fas fa-chart-line"></i>
                    <p>Add courses across trimesters to see your trajectory.</p>
                </div>`;
            return;
        }

        const uid = 'cg' + Math.random().toString(36).slice(2, 7);
        const width = Math.max(560, history.length * 92);
        const height = 240;
        const padLeft = 34;
        const padRight = 24;
        const padTop = 36;
        const padBottom = 32;
        const chartWidth = width - padLeft - padRight;
        const chartHeight = height - padTop - padBottom;

        const yMin = 0, yMax = 4.0;
        const getY = val => padTop + chartHeight - ((val - yMin) / (yMax - yMin)) * chartHeight;
        const getX = idx => history.length === 1 ? padLeft + chartWidth / 2 : padLeft + (idx / (history.length - 1)) * chartWidth;

        // Build smooth path (Catmull-Rom -> cubic bezier) for a designed curve, not a jagged polyline
        function smoothPath(getVal) {
            const pts = history.map((h, i) => [getX(i), getY(getVal(h))]);
            if (pts.length === 1) return { line: `M ${pts[0][0]} ${pts[0][1]}`, pts };
            let d = `M ${pts[0][0]} ${pts[0][1]}`;
            for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[i - 1] || pts[i];
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const p3 = pts[i + 2] || p2;
                const t = 0.18;
                const c1x = p1[0] + (p2[0] - p0[0]) * t;
                const c1y = p1[1] + (p2[1] - p0[1]) * t;
                const c2x = p2[0] - (p3[0] - p1[0]) * t;
                const c2y = p2[1] - (p3[1] - p1[1]) * t;
                d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
            }
            return { line: d, pts };
        }

        const cgpa = smoothPath(h => h.cumulativeCGPA);
        const term = smoothPath(h => h.gpa);
        const baseline = getY(yMin);
        const areaPath = cgpa.line + ` L ${cgpa.pts[cgpa.pts.length - 1][0]} ${baseline} L ${cgpa.pts[0][0]} ${baseline} Z`;

        const yThreshold = getY(minCgpa);

        let svg = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%; min-width:${width}px; height:${height}px; display:block;">
            <defs>
                <linearGradient id="${uid}-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--ez-primary)" stop-opacity="0.12"/>
                    <stop offset="100%" stop-color="var(--ez-primary)" stop-opacity="0"/>
                </linearGradient>
                <filter id="${uid}-dot" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-opacity="0.15"/>
                </filter>
            </defs>`;

        // Horizontal gridlines + y labels (0..4)
        for (let g = 0; g <= 4; g++) {
            const y = getY(g);
            svg += `<line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="var(--ez-border-subtle)" stroke-width="1"/>`;
            svg += `<text x="${padLeft - 9}" y="${y + 3.5}" fill="var(--ez-text-4)" font-size="10" font-weight="500" text-anchor="end">${g}.0</text>`;
        }

        // Probation threshold band
        svg += `<line x1="${padLeft}" y1="${yThreshold}" x2="${width - padRight}" y2="${yThreshold}" stroke="var(--ez-danger)" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.6"/>`;
        svg += `<text x="${width - padRight}" y="${yThreshold - 6}" fill="var(--ez-danger)" font-size="9" font-weight="600" text-anchor="end">Probation ${minCgpa.toFixed(2)}</text>`;

        // Area fill under cumulative line
        svg += `<path d="${areaPath}" fill="url(#${uid}-area)"/>`;

        // Term GPA line (dashed, secondary)
        svg += `<path d="${term.line}" fill="none" stroke="var(--ez-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 4" opacity="0.55"/>`;

        // Cumulative CGPA line (solid, primary)
        svg += `<path d="${cgpa.line}" fill="none" stroke="var(--ez-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;

        // X labels + points
        history.forEach((h, i) => {
            const x = getX(i);
            svg += `<text x="${x}" y="${height - 10}" fill="var(--ez-text-3)" font-size="10" font-weight="600" text-anchor="middle">${h.trimester}</text>`;

            svg += `<circle cx="${x}" cy="${getY(h.gpa)}" r="2.5" fill="#ffffff" stroke="var(--ez-primary)" stroke-width="1.5" opacity="0.8"><title>${h.trimester} term GPA ${h.gpa.toFixed(2)}</title></circle>`;
            svg += `<circle cx="${x}" cy="${getY(h.cumulativeCGPA)}" r="4" fill="var(--ez-primary)" stroke="#ffffff" stroke-width="2" filter="url(#${uid}-dot)"><title>${h.trimester} cumulative CGPA ${h.cumulativeCGPA.toFixed(2)}</title></circle>`;
            
            // value callout on cumulative point with halo mask
            svg += `<text x="${x}" y="${getY(h.cumulativeCGPA) - 9}" fill="var(--ez-text)" font-size="10" font-weight="700" text-anchor="middle" stroke="#ffffff" stroke-width="4px" paint-order="stroke fill" stroke-linejoin="round">${h.cumulativeCGPA.toFixed(2)}</text>`;
        });

        svg += `</svg>`;
        wrap.innerHTML = svg;
    }

    // Render Courses Management Tab (with Live Search & Filters)
    function renderCourses() {
        const effective = getEffectiveCourses(courses);
        const tbody = document.getElementById('coursesTableBody');
        const filterBar = document.getElementById('courseFilterBar');

        const trimesters = Array.from(new Set(courses.map(c => c.trimester).filter(Boolean))).sort();
        const totalCount = courses.length;
        const runningCount = courses.filter(c => (c.status || '').toLowerCase().includes('running') || c.grade === 'RUNNING').length;
        const failedCount = courses.filter(c => c.grade === 'F').length;

        let chipsHtml = `
            <button class="ez-filter-btn ${activeFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">All (${totalCount})</button>
            <button class="ez-filter-btn ${activeFilter === 'RUNNING' ? 'active' : ''}" data-filter="RUNNING">Running (${runningCount})</button>
            <button class="ez-filter-btn ${activeFilter === 'FAILED' ? 'active' : ''}" data-filter="FAILED">Failed (${failedCount})</button>
        `;

        trimesters.forEach(t => {
            chipsHtml += `<button class="ez-filter-btn ${activeFilter === t ? 'active' : ''}" data-filter="${t}">${t}</button>`;
        });
        filterBar.innerHTML = chipsHtml;

        filterBar.querySelectorAll('.ez-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activeFilter = btn.dataset.filter;
                renderCourses();
            });
        });

        // Filter & Search Logic
        let filtered = courses;
        if (activeFilter === 'RUNNING') {
            filtered = courses.filter(c => (c.status || '').toLowerCase().includes('running') || c.grade === 'RUNNING');
        } else if (activeFilter === 'FAILED') {
            filtered = courses.filter(c => c.grade === 'F');
        } else if (activeFilter !== 'ALL') {
            filtered = courses.filter(c => c.trimester === activeFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(c => (c.courseId || '').toLowerCase().includes(q) || (c.courseName || '').toLowerCase().includes(q));
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 28px; color: var(--ez-text-muted);">No matching courses found.</td></tr>`;
            return;
        }

        let rowsHtml = '';
        filtered.forEach(c => {
            const inCgpaStatus = getCourseInCgpaStatus(c, courses, effective);
            const gradeClass = c.grade ? `grade-${c.grade.replace('+', '_plus').replace('-', '_minus')}` : 'grade-running';
            const gradeDisplay = c.grade ? c.grade : '—';

            let statusBadge = '<span class="status-tag status-tag-completed" style="color: var(--ez-success); font-weight: 600;"><i class="fas fa-circle-check"></i> Completed</span>';
            if ((c.status || '').toLowerCase().includes('running') || c.grade === 'RUNNING') {
                statusBadge = '<span class="status-tag" style="color: var(--ez-accent); font-weight: 600;"><i class="fas fa-spinner fa-spin"></i> Running</span>';
            } else if (c.grade === 'W' || (c.status || '').toLowerCase().includes('withdraw')) {
                statusBadge = '<span class="status-tag" style="color: var(--ez-text-muted);">Withdrawn</span>';
            } else if (c.grade === 'Dp' || (c.status || '').toLowerCase().includes('drop')) {
                statusBadge = '<span class="status-tag" style="color: var(--ez-text-muted);">Dropped</span>';
            }

            let inCgpaHtml = '<span style="color: var(--ez-text-muted); font-size: 0.75rem;">—</span>';
            if (inCgpaStatus.label === 'Yes') {
                inCgpaHtml = '<span class="ez-incgpa-yes"><i class="fas fa-circle-check"></i> Yes</span>';
            } else if (inCgpaStatus.label === 'Replaced') {
                inCgpaHtml = '<span class="ez-incgpa-replaced" title="Replaced by subsequent attempt"><i class="fas fa-arrows-rotate"></i> Replaced</span>';
            }

            rowsHtml += `
                <tr>
                    <td>
                        <span style="font-weight: 700; color: var(--ez-text);">${c.trimester || '—'}</span>
                        <span style="font-size: 0.75rem; color: var(--ez-text-muted); margin-left: 4px;">(${formatTrimester(c.trimester).split('(')[0].trim()})</span>
                    </td>
                    <td>
                        <div style="font-weight: 700; color: var(--ez-text);">${c.courseId}</div>
                        <div style="font-size: 0.775rem; color: var(--ez-text-muted);">${c.courseName || '—'}</div>
                    </td>
                    <td style="text-align: right; font-variant-numeric: tabular-nums;"><b>${c.credit}</b></td>
                    <td style="text-align: center;"><span class="ez-grade-badge ${gradeClass}">${gradeDisplay}</span></td>
                    <td>${statusBadge}</td>
                    <td style="text-align: center;">${inCgpaHtml}</td>
                    <td style="text-align: right;">
                        <div style="display: flex; justify-content: flex-end; gap: 4px;">
                            <button class="ez-mini-btn btn-edit-course" data-id="${c.id}" title="Edit Course"><i class="fas fa-pen"></i></button>
                            <button class="ez-mini-btn del-btn btn-del-course" data-id="${c.id}" title="Delete Course"><i class="fas fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = rowsHtml;

        tbody.querySelectorAll('.btn-edit-course').forEach(btn => {
            btn.addEventListener('click', () => openEditCourseModal(btn.dataset.id));
        });
        tbody.querySelectorAll('.btn-del-course').forEach(btn => {
            btn.addEventListener('click', () => deleteCourse(btn.dataset.id));
        });
    }

    // Render Target Planner Tab
    function renderTarget() {
        const metrics = calculateAcademicMetrics(courses);
        const targetVal = parseFloat(document.getElementById('targetCgpaInput').value) || 3.50;
        const nextCredits = parseFloat(document.getElementById('targetCreditsInput').value) || 12;

        const reqGpaEl = document.getElementById('targetRequiredGpa');
        const feasibilityEl = document.getElementById('targetFeasibilityBadge');
        const detailEl = document.getElementById('targetDetailText');
        const matrixBody = document.getElementById('targetMatrixBody');

        if (metrics.credits === 0) {
            reqGpaEl.textContent = targetVal.toFixed(2);
            feasibilityEl.textContent = 'Starting Point';
            feasibilityEl.className = 'ez-gauge-tier-pill tier-good';
            detailEl.textContent = `As your first trimester, your CGPA will match your semester GPA.`;
            return;
        }

        const requiredGpa = ((targetVal * (metrics.credits + nextCredits)) - metrics.points) / nextCredits;

        if (requiredGpa <= 0) {
            reqGpaEl.textContent = '0.00';
            feasibilityEl.textContent = 'Already Achieved';
            feasibilityEl.className = 'ez-gauge-tier-pill tier-outstanding';
            detailEl.textContent = `Your current CGPA (${metrics.cgpa.toFixed(2)}) is already higher than your target ${targetVal.toFixed(2)}.`;
        } else if (requiredGpa > 4.00) {
            reqGpaEl.textContent = requiredGpa.toFixed(2);
            feasibilityEl.textContent = 'Exceeds 4.00 Max';
            feasibilityEl.className = 'ez-gauge-tier-pill tier-probation';
            detailEl.textContent = `Requires a GPA of ${requiredGpa.toFixed(2)}, which exceeds UIU's 4.00 maximum. Plan retakes to lift baseline CGPA.`;
        } else {
            reqGpaEl.textContent = requiredGpa.toFixed(2);
            if (requiredGpa >= 3.75) {
                feasibilityEl.textContent = 'Challenging (Near Straight A)';
                feasibilityEl.className = 'ez-gauge-tier-pill tier-pass';
            } else {
                feasibilityEl.textContent = 'Achievable Goal';
                feasibilityEl.className = 'ez-gauge-tier-pill tier-outstanding';
            }
            detailEl.textContent = `You need an average GPA of ${requiredGpa.toFixed(2)} across your next ${nextCredits} credits to achieve a ${targetVal.toFixed(2)} CGPA.`;
        }

        // Outcome Simulation Matrix
        const scenarios = [4.00, 3.67, 3.33, 3.00, 2.67, 2.33, 2.00];
        let matrixHtml = '';
        scenarios.forEach(expGpa => {
            const expPoints = expGpa * nextCredits;
            const newCgpa = (metrics.points + expPoints) / (metrics.credits + nextCredits);
            const delta = newCgpa - metrics.cgpa;
            const sign = delta >= 0 ? '+' : '';
            const deltaClass = delta >= 0 ? 'tier-outstanding' : 'tier-probation';

            matrixHtml += `
                <tr>
                    <td><b>${expGpa.toFixed(2)}</b> (${getGradeLetter(expGpa)})</td>
                    <td><b style="color: var(--ez-primary); font-variant-numeric: tabular-nums;">${newCgpa.toFixed(3)}</b></td>
                    <td><span class="ez-gauge-tier-pill ${deltaClass}">${sign}${delta.toFixed(3)}</span></td>
                </tr>
            `;
        });
        matrixBody.innerHTML = matrixHtml;
    }

    // Render Graduation Tab
    function renderGraduation() {
        const metrics = calculateAcademicMetrics(courses);
        const history = calculateTrimesterHistory(courses);
        const totalReq = settings.programCredits || 138;
        const earned = metrics.earnedCredits;
        const remaining = Math.max(0, totalReq - earned);

        const pace = parseFloat(document.getElementById('gradPaceInput').value) || 12;
        const percent = Math.min(100, Math.round((earned / totalReq) * 100));

        document.getElementById('gradPercentText').textContent = `${percent}%`;
        document.getElementById('gradProgressBar').style.width = `${percent}%`;
        document.getElementById('gradEarnedText').textContent = `${earned} credits earned`;
        document.getElementById('gradTotalProgramText').textContent = `Total: ${totalReq} credits (${settings.dept === 'pharmacy' ? 'Pharmacy' : 'Regular'})`;
        document.getElementById('gradRemainingCredits').textContent = remaining;

        const termsLeft = pace > 0 ? Math.ceil(remaining / pace) : 0;
        document.getElementById('gradTermsLeft').textContent = termsLeft;

        if (history.length > 0 && termsLeft > 0) {
            let curTerm = history[history.length - 1].trimester;
            for (let i = 0; i < termsLeft; i++) curTerm = nextTrimesterCode(curTerm);
            document.getElementById('gradEstTerm').textContent = `Est. Graduation: ${formatTrimester(curTerm)}`;
        } else {
            document.getElementById('gradEstTerm').textContent = termsLeft === 0 ? 'Degree Completed!' : 'Est. Graduation: —';
        }

        const whatIfBody = document.getElementById('gradWhatIfBody');
        const scenarios = [
            { grade: 'A (4.00)', gpa: 4.00 },
            { grade: 'A- (3.67)', gpa: 3.67 },
            { grade: 'B+ (3.33)', gpa: 3.33 },
            { grade: 'B (3.00)', gpa: 3.00 },
            { grade: 'C+ (2.33)', gpa: 2.33 }
        ];

        let html = '';
        scenarios.forEach(sc => {
            const finalPoints = metrics.points + (sc.gpa * remaining);
            const finalCredits = metrics.credits + remaining;
            const finalCgpa = finalCredits > 0 ? (finalPoints / finalCredits) : 0;

            html += `
                <tr>
                    <td><b>${sc.grade}</b></td>
                    <td>${sc.gpa.toFixed(2)}</td>
                    <td><b style="color: var(--ez-primary); font-size: 1.1rem; font-variant-numeric: tabular-nums;">${finalCgpa.toFixed(2)}</b></td>
                </tr>
            `;
        });
        whatIfBody.innerHTML = html;
    }

    // Render Retake Optimizer Tab
    function renderRetakeAdvisor() {
        const metrics = calculateAcademicMetrics(courses);
        const container = document.getElementById('retakeListContainer');
        const tuitionRate = settings.tuitionPerCredit || 5000;

        const retakeCandidates = metrics.effective.filter(c => GRADE_POINTS.hasOwnProperty(c.grade) && GRADE_POINTS[c.grade] < 3.00);

        if (retakeCandidates.length === 0) {
            container.innerHTML = `
                <div style="padding: 36px; text-align: center; color: var(--ez-text-muted); background: var(--ez-surface); border-radius: var(--ez-radius-lg); border: 1px solid var(--ez-border);">
                    <i class="fas fa-circle-check" style="font-size: 2.5rem; color: var(--ez-success); margin-bottom: 10px; display: block;"></i>
                    <h3 style="color: var(--ez-text); margin-bottom: 4px;">Clean Academic Record</h3>
                    <p style="margin: 0;">You have no courses with grades below B. All completed courses are B (3.00) or higher!</p>
                </div>`;
            return;
        }

        const analyzed = retakeCandidates.map(c => {
            const targetGrade = retakeCustomTargets[c.courseId] || 'A';
            const targetPoint = GRADE_POINTS[targetGrade];
            const pointGain = (targetPoint - GRADE_POINTS[c.grade]) * c.credit;
            const newTotalPoints = metrics.points + pointGain;
            const newCgpa = metrics.credits > 0 ? (newTotalPoints / metrics.credits) : 0;
            const delta = newCgpa - metrics.cgpa;
            const cost = c.credit * tuitionRate * 0.5; // UIU 50% waiver

            return { course: c, targetGrade, newCgpa, delta, cost };
        });

        analyzed.sort((a, b) => b.delta - a.delta);

        let html = '';
        analyzed.forEach((item, idx) => {
            const c = item.course;
            const isSelected = selectedRetakeSims.has(c.courseId);

            html += `
                <div class="ez-retake-item">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" class="retake-sim-checkbox" data-course-id="${c.courseId}" ${isSelected ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
                        <div>
                            <div style="font-weight: 700; color: var(--ez-text); font-size: 0.95rem;">
                                #${idx + 1} ${c.courseId} <span style="font-weight: normal; color: var(--ez-text-muted); font-size: 0.8rem;">— ${c.courseName || 'Course'}</span>
                            </div>
                            <div style="font-size: 0.775rem; color: var(--ez-text-muted); display: flex; gap: 10px; margin-top: 2px;">
                                <span>${c.credit} Credits</span>
                                <span>Current: <b style="color: var(--ez-danger);">${c.grade} (${GRADE_POINTS[c.grade].toFixed(2)})</b></span>
                                <span>Term: ${c.trimester}</span>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <label style="font-size: 0.775rem; color: var(--ez-text-muted);">Retake as:</label>
                            <select class="ez-select retake-target-select" data-course-id="${c.courseId}" style="height: 30px; padding: 0 8px; font-size: 0.8rem; width: auto;">
                                <option value="A" ${item.targetGrade === 'A' ? 'selected' : ''}>A (4.00)</option>
                                <option value="A-" ${item.targetGrade === 'A-' ? 'selected' : ''}>A- (3.67)</option>
                                <option value="B+" ${item.targetGrade === 'B+' ? 'selected' : ''}>B+ (3.33)</option>
                                <option value="B" ${item.targetGrade === 'B' ? 'selected' : ''}>B (3.00)</option>
                            </select>
                        </div>

                        <div class="ez-boost-badge">
                            <i class="fas fa-arrow-up"></i>
                            +${item.delta.toFixed(3)} CGPA (to ${item.newCgpa.toFixed(2)})
                        </div>

                        <div style="font-size: 0.775rem; color: var(--ez-text-muted); white-space: nowrap;">
                            Fee: <b style="color: var(--ez-text);">${formatBDT(item.cost)}</b> (50% off)
                        </div>
                    </div>
                </div>
            `;
        });

        // Combined Multi-Retake Simulator
        if (selectedRetakeSims.size > 0) {
            let combinedPointGain = 0;
            let combinedCost = 0;
            let count = 0;

            retakeCandidates.forEach(c => {
                if (selectedRetakeSims.has(c.courseId)) {
                    const targetGrade = retakeCustomTargets[c.courseId] || 'A';
                    combinedPointGain += (GRADE_POINTS[targetGrade] - GRADE_POINTS[c.grade]) * c.credit;
                    combinedCost += c.credit * tuitionRate * 0.5;
                    count++;
                }
            });

            const combinedCgpa = metrics.credits > 0 ? ((metrics.points + combinedPointGain) / metrics.credits) : 0;
            const combinedDelta = combinedCgpa - metrics.cgpa;

            html = `
                <div class="ez-card" style="border: 2px solid var(--ez-primary); background: var(--ez-primary-soft); margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <h3 style="margin: 0; color: var(--ez-primary); font-size: 1.05rem;">
                                <i class="fas fa-calculator"></i> Combined Retake Simulator (${count} courses selected)
                            </h3>
                            <p style="margin: 3px 0 0 0; font-size: 0.85rem; color: var(--ez-text);">
                                Projected Combined CGPA: <b style="font-size: 1.25rem; font-variant-numeric: tabular-nums; color: var(--ez-text);">${combinedCgpa.toFixed(3)}</b>
                                (<span style="color: var(--ez-success); font-weight: 700;">+${combinedDelta.toFixed(3)}</span> boost)
                            </p>
                        </div>
                        <div style="font-size: 0.85rem; font-weight: 700;">
                            Estimated Tuition (50% Waiver): <span style="color: var(--ez-primary);">${formatBDT(combinedCost)}</span>
                        </div>
                    </div>
                </div>
            ` + html;
        }

        container.innerHTML = html;

        container.querySelectorAll('.retake-target-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                retakeCustomTargets[e.target.dataset.courseId] = e.target.value;
                renderRetakeAdvisor();
            });
        });

        container.querySelectorAll('.retake-sim-checkbox').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const id = e.target.dataset.courseId;
                if (e.target.checked) selectedRetakeSims.add(id);
                else selectedRetakeSims.delete(id);
                renderRetakeAdvisor();
            });
        });
    }

    // Render Running Course Projections
    function renderProjection() {
        const runningCourses = courses.filter(c => (c.status || '').toLowerCase().includes('running') || c.grade === 'RUNNING');
        const container = document.getElementById('projectionRowsContainer');
        const metrics = calculateAcademicMetrics(courses);

        if (runningCourses.length === 0) {
            container.innerHTML = `
                <div style="padding: 36px; text-align: center; color: var(--ez-text-muted);">
                    <i class="fas fa-circle-info" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    No running courses found. Mark courses as "Running Course" in the Courses tab to project them.
                </div>`;
            document.getElementById('projTermGpa').textContent = '0.00';
            document.getElementById('projCgpa').textContent = metrics.cgpa.toFixed(2);
            document.getElementById('projRunningCreditsText').textContent = '0 running credits';
            return;
        }

        const totalRunningCredits = runningCourses.reduce((sum, c) => sum + (c.credit || 0), 0);
        document.getElementById('projRunningCreditsText').textContent = `${totalRunningCredits} credits in progress`;

        let projTermPoints = 0;
        runningCourses.forEach(c => {
            const projectedGrade = runningProjections[c.id] || 'A';
            projTermPoints += (GRADE_POINTS[projectedGrade] || 4.00) * c.credit;
        });

        const projTermGpa = totalRunningCredits > 0 ? (projTermPoints / totalRunningCredits) : 0;
        document.getElementById('projTermGpa').textContent = projTermGpa.toFixed(2);

        const simulatedCourses = courses.map(c => {
            if (runningCourses.some(rc => rc.id === c.id)) {
                return Object.assign({}, c, {
                    grade: runningProjections[c.id] || 'A',
                    status: 'Completed'
                });
            }
            return c;
        });

        const projMetrics = calculateAcademicMetrics(simulatedCourses);
        document.getElementById('projCgpa').textContent = projMetrics.cgpa.toFixed(2);

        const delta = projMetrics.cgpa - metrics.cgpa;
        const sign = delta >= 0 ? '+' : '';
        const badgeClass = delta >= 0 ? 'tier-outstanding' : 'tier-probation';
        document.getElementById('projDeltaText').innerHTML = `
            <span class="ez-gauge-tier-pill ${badgeClass}">${sign}${delta.toFixed(3)} shift from current</span>`;

        let html = '';
        runningCourses.forEach(c => {
            const currentProj = runningProjections[c.id] || 'A';
            html += `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid var(--ez-border-subtle); gap: 12px;">
                    <div>
                        <div style="font-weight: 700; color: var(--ez-text); font-size: 0.9rem;">${c.courseId}</div>
                        <div style="font-size: 0.775rem; color: var(--ez-text-muted);">${c.courseName || 'Course'} (${c.credit} credits)</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.775rem; color: var(--ez-text-muted);">Expected Grade:</span>
                        <select class="ez-select proj-grade-select" data-id="${c.id}" style="height: 32px; padding: 0 8px; font-size: 0.85rem; font-weight: 700; width: auto;">
                            ${LETTER_GRADES.map(g => `<option value="${g}" ${currentProj === g ? 'selected' : ''}>${g} (${GRADE_POINTS[g].toFixed(2)})</option>`).join('')}
                        </select>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        container.querySelectorAll('.proj-grade-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                runningProjections[e.target.dataset.id] = e.target.value;
                renderProjection();
            });
        });
    }

    // Render Fees & Waivers Engine
    function renderFees() {
        const creditsInput = document.getElementById('feeCreditsInput');
        const thesisSelect = document.getElementById('feeThesisCredits');
        const perCreditInput = document.getElementById('feePerCreditRate');
        const trimesterInput = document.getElementById('feeTrimesterRate');
        const scholarshipSelect = document.getElementById('feeScholarshipSelect');
        const retakeCreditsInput = document.getElementById('feeRetakeCredits');
        const creditLoadAlert = document.getElementById('feeCreditLoadAlert');

        const runningCourses = courses.filter(c => (c.status || '').toLowerCase().includes('running') || c.grade === 'RUNNING');
        const runningCr = runningCourses.reduce((sum, c) => sum + (c.credit || 0), 0);

        if (runningCr > 0 && (!creditsInput.dataset.modified || creditsInput.dataset.modified === 'false')) {
            creditsInput.value = runningCr;

            // Auto-detect Thesis/Project course (CSE 4000A/B/C or Final Year Design Project - 2 credits each)
            let detectedThesisCr = 0;
            runningCourses.forEach(c => {
                const id = (c.courseId || '').toUpperCase();
                const name = (c.courseName || '').toLowerCase();
                if (id.includes('4000') || name.includes('thesis') || name.includes('design project') || name.includes('project') || name.includes('internship')) {
                    detectedThesisCr += (c.credit || 2);
                }
            });
            if (detectedThesisCr > 0 && thesisSelect) {
                thesisSelect.value = String(Math.min(6, detectedThesisCr));
            }
        }

        const credits = parseFloat(creditsInput.value) || 0;
        const perCreditFee = parseFloat(perCreditInput.value) || settings.tuitionPerCredit;
        const trimesterFee = parseFloat(trimesterInput.value) || settings.perTrimesterFee;
        const scholarshipRate = parseFloat(scholarshipSelect.value) || 0;

        // UIU Thesis rule: 6-credit thesis is taken as 2 credits each term; strictly 0% waiver!
        const thesisCredits = thesisSelect ? Math.min(credits, parseFloat(thesisSelect.value) || 0) : 0;

        // Retake credits: 50% waiver
        const retakeCredits = Math.min(Math.max(0, credits - thesisCredits), parseFloat(retakeCreditsInput.value) || 0);

        // Regular coursework credits eligible for merit scholarship
        const regularCredits = Math.max(0, credits - thesisCredits - retakeCredits);

        // UIU 9-Credit Minimum Load Rule (14 for Pharmacy)
        const minReq = settings.dept === 'pharmacy' ? 14 : 9;
        const meetsMinCredits = credits >= minReq;
        if (creditLoadAlert) {
            if (!meetsMinCredits && scholarshipRate > 0) {
                creditLoadAlert.style.display = 'flex';
                creditLoadAlert.innerHTML = `
                    <i class="fas fa-triangle-exclamation" style="margin-top: 2px;"></i>
                    <div>
                        <b>UIU 9-Credit Rule Alert:</b> Registered for ${credits} credits. UIU requires at least <b>${minReq} credits</b> (${settings.dept === 'pharmacy' ? 'Pharmacy' : 'Regular'}) to maintain/avail scholarships. Scholarship waiver cannot be applied.
                    </div>
                `;
            } else {
                creditLoadAlert.style.display = 'none';
            }
        }

        const baseTuition = credits * perCreditFee;
        const retakeDiscount = retakeCredits * perCreditFee * 0.50; // 50% waiver

        let scholarshipDiscount = 0;
        if (meetsMinCredits && scholarshipRate > 0) {
            scholarshipDiscount = regularCredits * perCreditFee * scholarshipRate;
        }

        const totalDiscount = scholarshipDiscount + retakeDiscount;
        const netTuition = Math.max(0, baseTuition - totalDiscount);
        const totalPayable = netTuition + trimesterFee;

        document.getElementById('feeBaseTuition').textContent = formatBDT(baseTuition);
        document.getElementById('feeDiscountAmount').textContent = `-${formatBDT(totalDiscount)}`;
        document.getElementById('feeTrimesterAmount').textContent = formatBDT(trimesterFee);
        document.getElementById('feeTotalPayable').textContent = formatBDT(totalPayable);

        const installmentsGrid = document.getElementById('feeInstallmentsGrid');
        if (settings.dept === 'pharmacy') {
            const instAmount = Math.round(totalPayable / 4);
            installmentsGrid.innerHTML = `
                <div class="ez-inst-card first-due">
                    <div class="ez-inst-label">1st Installment (25%)</div>
                    <div class="ez-inst-val">${formatBDT(instAmount)}</div>
                </div>
                <div class="ez-inst-card">
                    <div class="ez-inst-label">2nd Installment (25%)</div>
                    <div class="ez-inst-val">${formatBDT(instAmount)}</div>
                </div>
                <div class="ez-inst-card">
                    <div class="ez-inst-label">3rd Installment (25%)</div>
                    <div class="ez-inst-val">${formatBDT(instAmount)}</div>
                </div>
                <div class="ez-inst-card">
                    <div class="ez-inst-label">4th Installment (25%)</div>
                    <div class="ez-inst-val">${formatBDT(totalPayable - instAmount * 3)}</div>
                </div>
            `;
        } else {
            const inst1 = Math.round(totalPayable * 0.40);
            const inst2 = Math.round(totalPayable * 0.30);
            const inst3 = totalPayable - inst1 - inst2;
            installmentsGrid.innerHTML = `
                <div class="ez-inst-card first-due">
                    <div class="ez-inst-label">1st Installment (40%)</div>
                    <div class="ez-inst-val">${formatBDT(inst1)}</div>
                </div>
                <div class="ez-inst-card">
                    <div class="ez-inst-label">2nd Installment (30%)</div>
                    <div class="ez-inst-val">${formatBDT(inst2)}</div>
                </div>
                <div class="ez-inst-card">
                    <div class="ez-inst-label">3rd Installment (30%)</div>
                    <div class="ez-inst-val">${formatBDT(inst3)}</div>
                </div>
            `;
        }
    }

    // Render Probation Recovery Plan Tab
    function renderProbationRecovery() {
        const metrics = calculateAcademicMetrics(courses);
        const minCgpa = settings.dept === 'pharmacy' ? 2.50 : 2.00;
        const gap = Math.max(0, minCgpa - metrics.cgpa);

        document.getElementById('recoveryGap').textContent = gap.toFixed(2);

        const requiredNumerator = (minCgpa * metrics.credits) - metrics.points;
        const minCreditsToEscape = requiredNumerator <= 0 ? 0 : Math.ceil(requiredNumerator / (4.0 - minCgpa));
        document.getElementById('recoveryMinCredits').textContent = minCreditsToEscape;

        const next12Cr = 12;
        const reqGpa12 = ((minCgpa * (metrics.credits + next12Cr)) - metrics.points) / next12Cr;
        document.getElementById('recoveryRequiredGpa').textContent = reqGpa12 > 4.00 ? '4.00+' : reqGpa12.toFixed(2);

        const container = document.getElementById('recoveryRoadmapContainer');
        const failedCourses = metrics.effective.filter(c => c.grade === 'F');

        const terms = [
            { code: 'ZA1 (1st Probation Trimester)', targetTermGpa: 3.50, credits: 12 },
            { code: 'ZA2 (2nd Probation Trimester)', targetTermGpa: 3.50, credits: 12 },
            { code: 'ZA3 (Final Chance Ceiling)', targetTermGpa: 3.50, credits: 12 }
        ];

        let simPoints = metrics.points;
        let simCredits = metrics.credits;
        let roadmapHtml = '';

        terms.forEach((t, i) => {
            const retakesInTerm = [];
            let termCr = 0;
            while (failedCourses.length > 0 && termCr + failedCourses[0].credit <= t.credits) {
                const fc = failedCourses.shift();
                retakesInTerm.push(fc);
                termCr += fc.credit;
                simPoints += 4.00 * fc.credit; // retake as A
            }

            const freshCredits = Math.max(0, t.credits - termCr);
            simPoints += freshCredits * t.targetTermGpa;
            simCredits += freshCredits;

            const projectedCumCgpa = simCredits > 0 ? (simPoints / simCredits) : 0;
            const cleared = projectedCumCgpa >= minCgpa;

            roadmapHtml += `
                <div class="ez-card" style="margin-bottom: 12px; border-left: 4px solid ${cleared ? 'var(--ez-success)' : 'var(--ez-warning)'};">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--ez-text);">
                            Term ${i + 1}: ${t.code}
                        </h4>
                        <span class="ez-gauge-tier-pill ${cleared ? 'tier-outstanding' : 'tier-probation'}">
                            ${cleared ? 'Probation Cleared!' : 'Probation Extended'}
                        </span>
                    </div>
                    <p style="margin: 0 0 6px 0; font-size: 0.8rem; color: var(--ez-text-muted);">
                        Course Load: <b>${t.credits} Credits</b> · Target Semester GPA: <b>${t.targetTermGpa.toFixed(2)}</b>
                    </p>
                    ${retakesInTerm.length > 0 ? `
                        <div style="font-size: 0.775rem; color: var(--ez-primary); margin-bottom: 4px;">
                            <i class="fas fa-arrows-rotate"></i> Retake Priority: ${retakesInTerm.map(r => `${r.courseId} (${r.credit}cr)`).join(', ')}
                        </div>
                    ` : ''}
                    <div style="font-size: 0.775rem; color: var(--ez-text-muted);">
                        Projected Cumulative CGPA after this term: <b style="color: var(--ez-text);">${projectedCumCgpa.toFixed(2)}</b>
                    </div>
                </div>
            `;
        });

        container.innerHTML = roadmapHtml;
    }

    // Modal Handlers & Live Course Autocomplete
    function openAddCourseModal() {
        document.getElementById('courseModalTitle').innerHTML = '<i class="fas fa-book" style="color: var(--ez-primary); margin-right: 6px;"></i> Add Course';
        document.getElementById('editCourseId').value = '';
        document.getElementById('modalCourseTrimester').value = courses.length > 0 ? courses[courses.length - 1].trimester : '251';
        document.getElementById('modalCourseId').value = '';
        document.getElementById('modalCourseName').value = '';
        document.getElementById('modalCourseCredit').value = '3';
        document.getElementById('modalCourseGrade').value = 'A';
        document.getElementById('modalCourseAutocomplete').style.display = 'none';
        document.getElementById('courseModal').classList.add('open');
    }

    function openEditCourseModal(courseId) {
        const c = courses.find(item => item.id === courseId);
        if (!c) return;

        document.getElementById('courseModalTitle').innerHTML = '<i class="fas fa-pen" style="color: var(--ez-primary); margin-right: 6px;"></i> Edit Course';
        document.getElementById('editCourseId').value = c.id;
        document.getElementById('modalCourseTrimester').value = c.trimester;
        document.getElementById('modalCourseId').value = c.courseId;
        document.getElementById('modalCourseName').value = c.courseName || '';
        document.getElementById('modalCourseCredit').value = String(c.credit);
        document.getElementById('modalCourseAutocomplete').style.display = 'none';

        if ((c.status || '').toLowerCase().includes('running') || c.grade === 'RUNNING') {
            document.getElementById('modalCourseGrade').value = 'RUNNING';
        } else if (c.grade) {
            document.getElementById('modalCourseGrade').value = c.grade;
        } else {
            document.getElementById('modalCourseGrade').value = 'A';
        }

        document.getElementById('courseModal').classList.add('open');
    }

    function closeCourseModal() {
        document.getElementById('courseModal').classList.remove('open');
    }

    function saveCourseFromModal(e) {
        e.preventDefault();
        const editId = document.getElementById('editCourseId').value;
        const trimester = document.getElementById('modalCourseTrimester').value.trim();
        const courseId = document.getElementById('modalCourseId').value.trim().toUpperCase();
        const courseName = document.getElementById('modalCourseName').value.trim();
        const credit = parseFloat(document.getElementById('modalCourseCredit').value) || 3;
        const gradeVal = document.getElementById('modalCourseGrade').value;

        let grade = gradeVal;
        let status = 'Completed';

        if (gradeVal === 'RUNNING') {
            grade = '';
            status = 'Running Course';
        } else if (gradeVal === 'W') {
            status = 'Withdraw';
        } else if (gradeVal === 'Dp') {
            status = 'Dropped';
        }

        if (editId) {
            const idx = courses.findIndex(c => c.id === editId);
            if (idx >= 0) {
                courses[idx].trimester = trimester;
                courses[idx].courseId = courseId;
                courses[idx].courseName = courseName;
                courses[idx].credit = credit;
                courses[idx].grade = grade;
                courses[idx].status = status;
                showToast(`Updated course ${courseId}`, 'success');
            }
        } else {
            courses.push({
                id: 'course_' + Math.random().toString(36).substr(2, 9),
                trimester: trimester,
                courseId: courseId,
                courseName: courseName,
                credit: credit,
                grade: grade,
                status: status
            });
            showToast(`Added course ${courseId}`, 'success');
        }

        saveData();
        closeCourseModal();
        refreshAllViews();
    }

    function deleteCourse(courseId) {
        if (!confirm('Are you sure you want to remove this course record?')) return;
        courses = courses.filter(c => c.id !== courseId);
        saveData();
        showToast('Course removed', 'info');
        refreshAllViews();
    }

    // Refresh all views
    function refreshAllViews() {
        renderDashboard();
        renderCourses();
        renderTarget();
        renderGraduation();
        renderRetakeAdvisor();
        renderProjection();
        renderFees();
        renderProbationRecovery();
    }

    // Print Fee Slip
    function printFeeSlip() {
        window.print();
    }

    // Setup Event Listeners
    function setupEventListeners() {
        // Tab switching
        const dockBtns = document.querySelectorAll('.ez-dock-btn');
        dockBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dockBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                const targetTab = document.getElementById(`tab-${btn.dataset.tab}`);
                if (targetTab) targetTab.classList.add('active');

                if (btn.dataset.tab === 'target') renderTarget();
                if (btn.dataset.tab === 'graduation') renderGraduation();
                if (btn.dataset.tab === 'retake') renderRetakeAdvisor();
                if (btn.dataset.tab === 'projection') renderProjection();
                if (btn.dataset.tab === 'fees') renderFees();
                if (btn.dataset.tab === 'recovery') renderProbationRecovery();
            });
        });

        // Autocomplete in Add Course Modal
        const courseIdInput = document.getElementById('modalCourseId');
        const autoResults = document.getElementById('modalCourseAutocomplete');

        courseIdInput.addEventListener('input', () => {
            const val = courseIdInput.value.trim().toLowerCase();
            if (val.length < 2 || courseCatalog.length === 0) {
                autoResults.style.display = 'none';
                return;
            }

            const matches = courseCatalog.filter(c =>
                c.course_code.toLowerCase().includes(val) || (c.course_name || '').toLowerCase().includes(val)
            ).slice(0, 6);

            if (matches.length > 0) {
                autoResults.innerHTML = matches.map(c => `
                    <div class="ez-autocomplete-item" data-code="${c.course_code}" data-name="${c.course_name}" data-credit="${c.credit}">
                        <span><b>${c.course_code}</b> — ${c.course_name}</span>
                        <span style="font-size: 0.75rem; color: var(--ez-text-muted);">${c.credit} Cr</span>
                    </div>
                `).join('');
                autoResults.style.display = 'block';

                autoResults.querySelectorAll('.ez-autocomplete-item').forEach(item => {
                    item.addEventListener('click', () => {
                        courseIdInput.value = item.dataset.code;
                        document.getElementById('modalCourseName').value = item.dataset.name;
                        document.getElementById('modalCourseCredit').value = String(item.dataset.credit);
                        autoResults.style.display = 'none';
                    });
                });
            } else {
                autoResults.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (!courseIdInput.contains(e.target) && !autoResults.contains(e.target)) {
                autoResults.style.display = 'none';
            }
        });

        // Live Table Search
        const searchInput = document.getElementById('courseTableSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim();
                renderCourses();
            });
        }

        // Top Action Deck
        document.getElementById('btnDemoData').addEventListener('click', () => {
            courses = parseCSV(DEMO_TRANSCRIPT_CSV);
            saveData();
            showToast('Loaded UIU demo transcript with thesis & retakes', 'success');
            refreshAllViews();
        });

        document.getElementById('btnExport').addEventListener('click', exportCSV);

        document.getElementById('btnShare').addEventListener('click', () => {
            const metrics = calculateAcademicMetrics(courses);
            const text = `My UIU CGPA is ${metrics.cgpa.toFixed(2)} (${metrics.earnedCredits} credits earned). Calculated with EZ_UIU!`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    showToast('Summary copied to clipboard!', 'success');
                }).catch(() => showToast(text, 'info'));
            } else {
                showToast(text, 'info');
            }
        });

        document.getElementById('btnResetData').addEventListener('click', () => {
            if (confirm('Clear all courses and reset?')) {
                courses = [];
                saveData();
                showToast('All course records cleared', 'info');
                refreshAllViews();
            }
        });

        // CSV File Import
        const csvFileInput = document.getElementById('csvFileInput');
        csvFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const parsed = parseCSV(evt.target.result);
                    if (parsed.length > 0) {
                        courses = parsed;
                        saveData();
                        showToast(`Imported ${parsed.length} courses!`, 'success');
                        refreshAllViews();
                    } else {
                        showToast('No valid course records found in CSV', 'error');
                    }
                } catch (err) {
                    showToast('Failed to parse CSV: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
            csvFileInput.value = '';
        });

        // UCam Modal
        const ucamModal = document.getElementById('ucamModal');
        document.getElementById('btnFromUcam').addEventListener('click', () => {
            document.getElementById('ucamInputText').value = '';
            ucamModal.classList.add('open');
        });
        document.getElementById('btnCloseUcamModal').addEventListener('click', () => ucamModal.classList.remove('open'));
        document.getElementById('btnCancelUcamModal').addEventListener('click', () => ucamModal.classList.remove('open'));
        document.getElementById('btnParseUcam').addEventListener('click', () => {
            const input = document.getElementById('ucamInputText').value;
            try {
                const res = parseUcamSource(input);
                courses = res.courses;
                if (res.dept) {
                    settings.dept = res.dept;
                    document.getElementById('settingDept').value = res.dept;
                }
                saveData();
                ucamModal.classList.remove('open');
                showToast(`Imported ${res.courses.length} courses from UCam!`, 'success');
                refreshAllViews();
            } catch (err) {
                alert(err.message);
            }
        });

        // Course Modal
        document.getElementById('btnOpenAddCourseModal').addEventListener('click', openAddCourseModal);
        document.getElementById('btnDashAddCourse').addEventListener('click', openAddCourseModal);
        document.getElementById('btnDashViewCourses').addEventListener('click', () => {
            const coursesBtn = document.querySelector('[data-tab="courses"]');
            if (coursesBtn) coursesBtn.click();
        });
        document.getElementById('btnGoToRecovery').addEventListener('click', () => {
            const recBtn = document.querySelector('[data-tab="recovery"]');
            if (recBtn) recBtn.click();
        });

        document.getElementById('btnCloseCourseModal').addEventListener('click', closeCourseModal);
        document.getElementById('btnCancelCourseModal').addEventListener('click', closeCourseModal);
        document.getElementById('courseForm').addEventListener('submit', saveCourseFromModal);

        // Target Planner inputs
        document.getElementById('targetCgpaInput').addEventListener('input', renderTarget);
        document.getElementById('targetCreditsInput').addEventListener('input', renderTarget);

        // Graduation pace input
        document.getElementById('gradPaceInput').addEventListener('input', renderGraduation);

        // Projection presets
        document.getElementById('btnProjAllA').addEventListener('click', () => {
            courses.forEach(c => {
                if ((c.status || '').toLowerCase().includes('running') || c.grade === 'RUNNING') {
                    runningProjections[c.id] = 'A';
                }
            });
            renderProjection();
            showToast('All running courses projected as A (4.00)', 'info');
        });

        document.getElementById('btnProjAllB').addEventListener('click', () => {
            courses.forEach(c => {
                if ((c.status || '').toLowerCase().includes('running') || c.grade === 'RUNNING') {
                    runningProjections[c.id] = 'B';
                }
            });
            renderProjection();
            showToast('All running courses projected as B (3.00)', 'info');
        });

        document.getElementById('btnProjReset').addEventListener('click', () => {
            runningProjections = {};
            renderProjection();
            showToast('Projections reset', 'info');
        });

        // Fees inputs
        const feeInputs = ['feeCreditsInput', 'feeThesisCredits', 'feePerCreditRate', 'feeTrimesterRate', 'feeScholarshipSelect', 'feeRetakeCredits'];
        feeInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    if (id === 'feeCreditsInput') el.dataset.modified = 'true';
                    renderFees();
                });
                el.addEventListener('change', () => {
                    if (id === 'feeCreditsInput') el.dataset.modified = 'true';
                    renderFees();
                });
            }
        });

        const printBtn = document.getElementById('btnPrintFeeSlip');
        if (printBtn) printBtn.addEventListener('click', printFeeSlip);

        // Settings inputs
        const deptSelect = document.getElementById('settingDept');
        deptSelect.value = settings.dept;
        deptSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            settings.dept = val;
            const def = DEPT_PROFILES[val] || DEPT_PROFILES.regular;
            settings.programCredits = def.defaultCredits;
            settings.tuitionPerCredit = def.defaultTuition;
            document.getElementById('settingProgramCredits').value = def.defaultCredits;
            document.getElementById('settingTuitionPerCredit').value = def.defaultTuition;
            saveData();
            showToast(`Switched program to ${def.name}`, 'info');
            refreshAllViews();
        });

        document.getElementById('settingProgramCredits').value = settings.programCredits;
        document.getElementById('settingProgramCredits').addEventListener('change', (e) => {
            settings.programCredits = parseFloat(e.target.value) || 138;
            saveData();
            refreshAllViews();
        });

        document.getElementById('settingTuitionPerCredit').value = settings.tuitionPerCredit;
        document.getElementById('settingTuitionPerCredit').addEventListener('change', (e) => {
            settings.tuitionPerCredit = parseFloat(e.target.value) || 5000;
            saveData();
            refreshAllViews();
        });

        document.getElementById('settingPerTrimesterFee').value = settings.perTrimesterFee;
        document.getElementById('settingPerTrimesterFee').addEventListener('change', (e) => {
            settings.perTrimesterFee = parseFloat(e.target.value) || 6500;
            saveData();
            refreshAllViews();
        });

        document.getElementById('btnSettingsDemo').addEventListener('click', () => {
            courses = parseCSV(DEMO_TRANSCRIPT_CSV);
            saveData();
            showToast('Demo transcript loaded', 'success');
            refreshAllViews();
        });

        document.getElementById('btnSettingsExportJson').addEventListener('click', () => {
            const data = { courses, settings, exportedAt: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `EZ_UIU_Academic_Backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('JSON backup exported', 'success');
        });

        document.getElementById('btnSettingsClear').addEventListener('click', () => {
            if (confirm('Clear all course records?')) {
                courses = [];
                saveData();
                showToast('Cleared all records', 'info');
                refreshAllViews();
            }
        });
    }

    // Helper: Grade letter from point
    function getGradeLetter(point) {
        const p = parseFloat(point);
        if (p >= 4.0) return 'A';
        if (p >= 3.67) return 'A-';
        if (p >= 3.33) return 'B+';
        if (p >= 3.0) return 'B';
        if (p >= 2.67) return 'B-';
        if (p >= 2.33) return 'C+';
        if (p >= 2.0) return 'C';
        if (p >= 1.67) return 'C-';
        if (p >= 1.33) return 'D+';
        if (p >= 1.0) return 'D';
        return 'F';
    }

    // Initialization
    async function init() {
        await loadCatalog();
        loadSavedData();
        setupEventListeners();
        refreshAllViews();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
