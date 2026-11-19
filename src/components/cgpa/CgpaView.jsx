import React, { useState, useMemo, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
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
import Surface from '../ui/Surface';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Input, { Field } from '../ui/Input';
import { type } from '../ui/tokens';
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
  DEPT_PROFILES,
  exportCSV,
  parseCSV,
  mergeCourseLists,
} from '../../utils/cgpaUtils';
import { useToast } from '../../context/ToastContext';

/* ---------- Minimalist Apple-grade animated gauge ring ---------- */
function GaugeRing({ cgpa, probation }) {
  const R = 64;
  const C = 2 * Math.PI * R;
  const frac = Math.max(0, Math.min(1, cgpa / 4));
  const size = 150;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke={probation ? 'var(--bad)' : 'var(--accent)'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - frac) }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          className={`num text-[34px] font-bold leading-none tracking-tight ${
            probation ? 'text-bad' : 'text-ink'
          }`}
        >
          <CountUp value={cgpa} />
        </div>
        <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-ink-3">
          of 4.00
        </div>
      </div>
    </div>
  );
}

/* ---------- A labelled progress bar used by two panels ---------- */
function ProgressBar({ label, valueText, pct, children }) {
  return (
    <div>
      <div className={`mb-1.5 flex items-baseline justify-between ${type.eyebrow}`}>
        <span>{label}</span>
        <span className="num text-[11px] font-bold text-ink">{valueText}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface2">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      </div>
      {children}
    </div>
  );
}

export function CgpaView({
  courses,
  setCourses,
  settings,
  setSettings,
  forceOpenUcam = false,
  onResetUcamTrigger,
}) {
  const { showToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [ucamOpen, setUcamOpen] = useState(false);
  const [runningOverrides, setRunningOverrides] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    if (forceOpenUcam) {
      setUcamOpen(true);
      onResetUcamTrigger?.();
    }
  }, [forceOpenUcam, onResetUcamTrigger]);

  const deptConfig = DEPT_PROFILES[settings.dept] || DEPT_PROFILES.regular;
  const programCredits = settings.programCredits || deptConfig.defaultCredits;

  const effective = useMemo(() => getEffectiveCourses(courses, runningOverrides), [courses, runningOverrides]);
  const metrics = useMemo(() => calculateAcademicMetrics(courses, runningOverrides), [courses, runningOverrides]);
  const history = useMemo(() => calculateTrimesterHistory(courses), [courses]);
  const honors = useMemo(
    () => getHonorsStanding(metrics.cgpa, metrics.earnedCredits, programCredits),
    [metrics, programCredits]
  );

  const probation = metrics.cgpa < (deptConfig.minCgpa || 2.0) && metrics.credits > 0;
  const creditPct = programCredits > 0 ? Math.min(100, (metrics.earnedCredits / programCredits) * 100) : 0;
  const prevTerm = history.length > 1 ? history[history.length - 2] : null;
  const termDelta = prevTerm ? history[history.length - 1].gpa - prevTerm.gpa : 0;

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

  const importUcam = (imported, dept, mode = 'merge') => {
    const { merged, updatedCount, addedCount } = mergeCourseLists(courses, imported, mode);
    setCourses(merged);
    setRunningOverrides({});
    if (dept && dept !== settings.dept) setSettings((p) => ({ ...p, dept }));
    if (mode === 'merge') {
      showToast(`Merged: ${addedCount} new courses, ${updatedCount} updated!`, 'success');
    } else {
      showToast(`Replaced transcript with ${merged.length} courses`, 'success');
    }
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
          const { merged, updatedCount, addedCount } = mergeCourseLists(courses, parsed, 'merge');
          setCourses(merged);
          showToast(`CSV: ${addedCount} new, ${updatedCount} updated courses!`, 'success');
        } else showToast('No courses found in that CSV', 'error');
      } catch {
        showToast('Could not read that CSV file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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

  const latestTerm = history.length ? history[history.length - 1] : null;

  return (
    <div className="flex flex-col gap-5">
      {/* ---------------- Header ---------------- */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            CGPA &amp; Academic Standing
          </h1>
          <p className="mt-0.5 text-xs text-ink-3">
            {deptConfig.name} · {programCredits} Credits
          </p>
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
          <Button
            variant="ghost"
            size="icon"
            icon={RotateCcw}
            onClick={resetAll}
            title="Clear transcript"
            aria-label="Clear transcript"
          />
        </div>
      </header>

      <Tabs tabs={tabs} value={tab} onChange={setTab} layoutId="cgpa-subtabs" />

      {/* ================= TAB PANELS (instant swap + CSS/motion entrance) ================= */}
      {tab === 'overview' && (
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="flex flex-col gap-4"
        >
          {courses.length === 0 && (
            <Surface
              className="border-accent/40 bg-accentSoft/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
            >
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Upload className="h-4 w-4 text-accent" />
                  No transcript loaded yet
                </h3>
                <p className="text-xs text-ink-3 mt-0.5">
                  Import your grades from UCam or a CSV file to compute your cumulative CGPA,
                  standing, and degree progress.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="primary" size="sm" icon={Upload} onClick={() => setUcamOpen(true)}>
                  Import from UCam
                </Button>
                <Button variant="secondary" size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>
                  Upload CSV
                </Button>
              </div>
            </Surface>
          )}

          {/* bento row */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            {/* hero gauge card */}
            <Surface pad="lg" className="xl:col-span-7">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <GaugeRing cgpa={metrics.cgpa} probation={probation} />
                <div className="min-w-0 flex-1">
                  <Badge
                    tone={probation ? 'bad' : metrics.earnedCredits > 0 ? 'accent' : 'neutral'}
                    icon={Award}
                  >
                    {honors.tier}
                  </Badge>
                  <p className={`${type.body} mt-2.5`}>{honors.description}</p>

                  <div className="mt-5">
                    <ProgressBar
                      label="Degree progress"
                      valueText={`${metrics.earnedCredits} / ${programCredits} cr`}
                      pct={creditPct}
                    >
                      <div className={`num mt-1.5 text-right ${type.micro} font-semibold`}>
                        {creditPct.toFixed(1)}% of program
                      </div>
                    </ProgressBar>
                  </div>
                </div>
              </div>
            </Surface>

            {/* stat grid */}
            <div className="grid grid-cols-2 gap-4 xl:col-span-5">
              <StatCard
                label="Latest term GPA"
                sub={latestTerm ? latestTerm.trimester : 'no graded terms'}
                bodyClassName="num flex items-baseline gap-2 text-[26px] font-bold leading-none tracking-[-0.02em] text-ink"
              >
                {latestTerm ? (
                  <>
                    <CountUp value={latestTerm.gpa} />
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
              </StatCard>

              <StatCard
                label="Earned credits"
                sub={`of ${programCredits} required`}
                bodyClassName="num text-[26px] font-bold leading-none tracking-[-0.02em] text-ink"
              >
                <CountUp value={metrics.earnedCredits} decimals={0} />
              </StatCard>

              <StatCard
                label="Failed credits"
                tone={metrics.failedCredits > 0 ? 'bad' : 'default'}
                sub={metrics.failedCredits > 0 ? 'retakes available' : 'clean record'}
                bodyClassName={`num text-[26px] font-bold leading-none tracking-[-0.02em] ${
                  metrics.failedCredits > 0 ? 'text-bad' : 'text-ink'
                }`}
              >
                <CountUp value={metrics.failedCredits} decimals={0} />
              </StatCard>

              <StatCard
                label="Grade points"
                sub={
                  <>
                    over <span className="num">{metrics.credits}</span> CGPA credits
                  </>
                }
                bodyClassName="num text-[26px] font-bold leading-none tracking-[-0.02em] text-ink"
              >
                <CountUp value={metrics.points} />
              </StatCard>
            </div>
          </div>

          {/* chart */}
          <Surface pad="lg">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Progression</h3>
            <GradeChart history={history} />
          </Surface>
        </motion.div>
      )}

      {tab === 'courses' && (
        <motion.div
          key="courses"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        >
          <CourseTable
            courses={courses}
            effectiveCourses={effective}
            runningOverrides={runningOverrides}
            onUpdateCourse={updateCourse}
            onDeleteCourse={deleteCourse}
            onSetRunningGrade={setRunningGrade}
            onAddCourseClick={() => setAddOpen(true)}
          />
        </motion.div>
      )}

      {tab === 'retake' && (
        <motion.div
          key="retake"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        >
          <RetakeLab courses={courses} effectiveCourses={effective} />
        </motion.div>
      )}

      {tab === 'target' && (
        <motion.div
          key="target"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        >
          <TargetPlanner courses={courses} totalDegreeCredits={programCredits} />
        </motion.div>
      )}

      {tab === 'probation' && (
        <motion.div
          key="probation"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        >
          <ProbationRecovery courses={courses} minCgpa={deptConfig.minCgpa} dept={settings.dept} />
        </motion.div>
      )}

      {tab === 'settings' && (
        <motion.div
          key="settings"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <Surface pad="lg">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Program</h3>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Department profile">
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
              </Field>
              <Field label="Program total credits">
                <Input
                  type="number"
                  className="num w-36 font-mono font-semibold"
                  value={settings.programCredits}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, programCredits: parseFloat(e.target.value) || 138 }))
                  }
                />
              </Field>
              <p className="rounded-lg bg-surface2/60 px-3 py-2.5 text-[11px] leading-relaxed text-ink-3">
                Honors tiers follow the official UIU convocation policy.
              </p>
            </div>
          </Surface>

          <Surface pad="lg">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Data</h3>
            <p className="mt-1 text-xs text-ink-3">Everything lives in this browser only.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="secondary" icon={Download} onClick={() => exportCSV(courses)}>
                Export transcript as CSV
              </Button>
              <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>
                Import CSV file
              </Button>
              <Button variant="danger" icon={RotateCcw} onClick={resetAll}>
                Clear all data
              </Button>
            </div>
          </Surface>
        </motion.div>
      )}

      <AddCourseModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAddCourse={addCourse}
        defaultTerm={latestTerm ? String(latestTerm.trimester) : '251'}
      />
      <UcamImportModal isOpen={ucamOpen} onClose={() => setUcamOpen(false)} onImportSuccess={importUcam} />
    </div>
  );
}

export default CgpaView;
