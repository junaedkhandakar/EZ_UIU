import React, { useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  BookOpen,
  LineChart,
  Target,
  ShieldAlert,
  Settings,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Tabs from '../ui/Tabs';
import Button from '../ui/Button';
import CountUp from '../ui/CountUp';
import { CourseTable } from './CourseTable';
import { AddCourseModal } from './AddCourseModal';
import { UcamImportModal } from './UcamImportModal';
import { RetakeLab } from './RetakeLab';
import { TargetPlanner } from './TargetPlanner';
import { ProbationRecovery } from './ProbationRecovery';
import GradeChart from './GradeChart';
import Select from '../ui/Select';
import {
  calculateAcademicMetrics,
  calculateTrimesterHistory,
  getEffectiveCourses,
  getHonorsStanding,
  DEMO_TRANSCRIPT_COURSES,
  DEPT_PROFILES,
  exportCSV,
  parseCSV,
} from '../../utils/cgpaUtils';
import { useToast } from '../../context/ToastContext';

/* ---------- gauge ring ---------- */
function GaugeRing({ cgpa, probation, credits }) {
  const R = 68;
  const C = 2 * Math.PI * R;
  const frac = Math.max(0, Math.min(1, cgpa / 4));
  const size = 160;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--surface-2)" strokeWidth="11" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke={probation ? 'var(--bad)' : 'url(#ringGrad)'}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.2,0,0,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={`num text-[38px] font-extrabold leading-none tracking-tight ${
            probation ? 'text-bad' : 'text-ink'
          }`}
        >
          <CountUp value={cgpa} />
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">
          of 4.00
        </div>
      </div>
    </div>
  );
}

/* ---------- main view ---------- */
export function CgpaView({ courses, setCourses, settings, setSettings }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [ucamOpen, setUcamOpen] = useState(false);
  const [runningOverrides, setRunningOverrides] = useState({});
  const fileRef = useRef(null);

  const deptConfig = DEPT_PROFILES[settings.dept] || DEPT_PROFILES.regular;
  const programCredits = settings.programCredits || deptConfig.defaultCredits;

  const effective = useMemo(() => getEffectiveCourses(courses, runningOverrides), [courses, runningOverrides]);
  const metrics = useMemo(() => calculateAcademicMetrics(courses, runningOverrides), [courses, runningOverrides]);
  const history = useMemo(() => calculateTrimesterHistory(courses), [courses]);
  const honors = useMemo(
    () => getHonorsStanding(metrics.cgpa, metrics.earnedCredits, programCredits),
    [metrics, programCredits]
  );

  const probation = metrics.cgpa < 2.0 && metrics.credits > 0;
  const creditPct = programCredits > 0 ? Math.min(100, (metrics.earnedCredits / programCredits) * 100) : 0;
  const prevTerm = history.length > 1 ? history[history.length - 2] : null;
  const termDelta = prevTerm ? history[history.length - 1].gpa - prevTerm.gpa : 0;

  /* ---------- handlers ---------- */
  const addCourse = (c) => {
    setCourses((prev) => [c, ...prev]);
    showToast(`Added ${c.courseId}`, 'success');
  };

  const updateCourse = (id, updates) =>
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

  const deleteCourse = (id) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    showToast('Course removed', 'info');
  };

  const setRunningGrade = (id, grade) =>
    setRunningOverrides((prev) => {
      const n = { ...prev };
      if (grade) n[id] = grade;
      else delete n[id];
      return n;
    });

  const importUcam = (imported, dept) => {
    setCourses(imported);
    setRunningOverrides({});
    if (dept && dept !== settings.dept) setSettings((p) => ({ ...p, dept }));
    showToast(`Imported ${imported.length} courses from UCam`, 'success');
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.55 } });
  };

  const importCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = parseCSV(String(evt.target?.result || ''));
        if (parsed.length) {
          setCourses(parsed);
          showToast(`Imported ${parsed.length} courses from CSV`, 'success');
        } else showToast('No courses found in that CSV', 'error');
      } catch {
        showToast('Could not read that CSV file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadDemo = () => {
    setCourses(DEMO_TRANSCRIPT_COURSES);
    setRunningOverrides({});
    showToast('Loaded demo transcript', 'info');
  };

  const resetAll = () => {
    if (window.confirm('Clear every course from your transcript?')) {
      setCourses([]);
      setRunningOverrides({});
      showToast('Transcript cleared', 'info');
    }
  };

  const tabs = [
    { value: 'overview', label: 'Overview', icon: LineChart },
    { value: 'courses', label: 'Courses', icon: BookOpen, badge: courses.length },
    { value: 'retake', label: 'Retake Lab', icon: Sparkles },
    { value: 'target', label: 'Target', icon: Target },
    { value: 'probation', label: 'Recovery', icon: ShieldAlert },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="view-in flex flex-col gap-5">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
            {deptConfig.name} · {programCredits} credits
          </div>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink sm:text-3xl">
            Academic Standing
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="md" icon={Upload} onClick={() => setUcamOpen(true)}>
            From UCam
          </Button>
          <Button variant="secondary" size="md" icon={Upload} onClick={() => fileRef.current?.click()}>
            CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
          <Button variant="secondary" size="md" icon={Download} onClick={() => exportCSV(courses)}>
            Export
          </Button>
          <Button variant="ghost" size="icon" icon={Sparkles} onClick={loadDemo} title="Load demo transcript" />
          <Button variant="ghost" size="icon" icon={RotateCcw} onClick={resetAll} title="Clear transcript" />
        </div>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {/* ================= OVERVIEW ================= */}
      {tab === 'overview' && (
        <div className="fade-in flex flex-col gap-4">
          {/* bento row */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            {/* hero gauge card */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6 xl:col-span-7">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <GaugeRing cgpa={metrics.cgpa} probation={probation} credits={metrics.credits} />
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
                      probation
                        ? 'border-bad/25 bg-bad/10 text-bad'
                        : honors.tier === 'Good Standing'
                          ? 'border-line bg-surface2 text-ink-2'
                          : 'border-accent/30 bg-accentSoft text-accent'
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" />
                    {honors.tier}
                  </span>
                  <p className="mt-2.5 text-xs leading-relaxed text-ink-2">{honors.description}</p>

                  <div className="mt-5">
                    <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
                      <span className="font-semibold uppercase tracking-[0.08em] text-ink-3">
                        Degree progress
                      </span>
                      <span className="num font-bold text-ink">
                        {metrics.earnedCredits}
                        <span className="font-medium text-ink-3"> / {programCredits} cr</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-700"
                        style={{ width: `${creditPct}%` }}
                      />
                    </div>
                    <div className="num mt-1.5 text-right text-[10.5px] font-semibold text-ink-3">
                      {creditPct.toFixed(1)}% of program
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* stat grid */}
            <div className="grid grid-cols-2 gap-4 xl:col-span-5 xl:grid-cols-2">
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-3">
                  Latest term GPA
                </div>
                <div className="num mt-2 flex items-baseline gap-2 text-[26px] font-bold leading-none tracking-tight text-ink">
                  {history.length ? (
                    <>
                      <CountUp value={history[history.length - 1].gpa} />
                      {Math.abs(termDelta) > 0.005 &&
                        (termDelta > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-ok" strokeWidth={2.6} />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-bad" strokeWidth={2.6} />
                        ))}
                    </>
                  ) : (
                    '—'
                  )}
                </div>
                <div className="mt-1.5 text-[11px] text-ink-3">
                  {history.length ? history[history.length - 1].trimester : 'no graded terms'}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-3">
                  Earned credits
                </div>
                <div className="num mt-2 text-[26px] font-bold leading-none tracking-tight text-ink">
                  <CountUp value={metrics.earnedCredits} decimals={0} />
                </div>
                <div className="mt-1.5 text-[11px] text-ink-3">of {programCredits} required</div>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-3">
                  Failed credits
                </div>
                <div
                  className={`num mt-2 text-[26px] font-bold leading-none tracking-tight ${
                    metrics.failedCredits > 0 ? 'text-bad' : 'text-ink'
                  }`}
                >
                  <CountUp value={metrics.failedCredits} decimals={0} />
                </div>
                <div className="mt-1.5 text-[11px] text-ink-3">
                  {metrics.failedCredits > 0 ? 'retakes available' : 'clean record'}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-3">
                  Grade points
                </div>
                <div className="num mt-2 text-[26px] font-bold leading-none tracking-tight text-ink">
                  <CountUp value={metrics.points} />
                </div>
                <div className="mt-1.5 text-[11px] text-ink-3">
                  over <span className="num">{metrics.credits}</span> CGPA credits
                </div>
              </div>
            </div>
          </div>

          {/* chart */}
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">Progression</h3>
              <div className="flex items-center gap-4 text-[11px] font-medium text-ink-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-[3px] w-4 rounded-full bg-gradient-to-r from-accent to-accent2" />
                  CGPA
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-[2px] w-4 rounded-full bg-ink-3" />
                  Term GPA
                </span>
              </div>
            </div>
            <GradeChart history={history} />
          </div>
        </div>
      )}

      {/* ================= COURSES ================= */}
      {tab === 'courses' && (
        <div className="fade-in">
          <CourseTable
            courses={courses}
            effectiveCourses={effective}
            runningOverrides={runningOverrides}
            onUpdateCourse={updateCourse}
            onDeleteCourse={deleteCourse}
            onSetRunningGrade={setRunningGrade}
            onAddCourseClick={() => setAddOpen(true)}
          />
        </div>
      )}

      {/* ================= RETAKE LAB ================= */}
      {tab === 'retake' && (
        <div className="fade-in">
          <RetakeLab courses={courses} effectiveCourses={effective} />
        </div>
      )}

      {/* ================= TARGET ================= */}
      {tab === 'target' && (
        <div className="fade-in">
          <TargetPlanner courses={courses} totalDegreeCredits={programCredits} />
        </div>
      )}

      {/* ================= RECOVERY ================= */}
      {tab === 'probation' && (
        <div className="fade-in">
          <ProbationRecovery courses={courses} minCgpa={deptConfig.minCgpa} dept={settings.dept} />
        </div>
      )}

      {/* ================= SETTINGS ================= */}
      {tab === 'settings' && (
        <div className="fade-in grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Program</h3>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">
                  Department profile
                </label>
                <Select
                  value={settings.dept}
                  onChange={(e) => {
                    const dept = e.target.value;
                    setSettings((p) => ({
                      ...p,
                      dept,
                      programCredits: DEPT_PROFILES[dept]?.defaultCredits || p.programCredits,
                    }));
                  }}
                >
                  {Object.entries(DEPT_PROFILES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">
                  Program total credits
                </label>
                <input
                  type="number"
                  value={settings.programCredits}
                  onChange={(e) => setSettings((p) => ({ ...p, programCredits: parseFloat(e.target.value) || 138 }))}
                  className="num w-36 rounded-xl border border-line bg-surface2/70 px-3.5 py-2.5 font-mono text-[13px] font-semibold text-ink transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <p className="rounded-xl bg-surface2/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-ink-3">
                {deptConfig.note || 'Honors tiers follow the official UIU convocation policy.'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Data</h3>
            <p className="mt-1 text-xs text-ink-3">Everything lives in this browser only.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="secondary" icon={Download} onClick={() => exportCSV(courses)}>
                Export transcript as CSV
              </Button>
              <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>
                Import CSV file
              </Button>
              <Button variant="secondary" icon={Sparkles} onClick={loadDemo}>
                Load demo transcript
              </Button>
              <Button variant="danger" icon={RotateCcw} onClick={resetAll}>
                Clear all data
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddCourseModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAddCourse={addCourse}
        defaultTerm={history.length ? String(history[history.length - 1].trimester) : '251'}
      />
      <UcamImportModal isOpen={ucamOpen} onClose={() => setUcamOpen(false)} onImportSuccess={importUcam} />
    </div>
  );
}

export default CgpaView;
