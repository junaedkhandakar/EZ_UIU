import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { SegmentedControl } from '../common/SegmentedControl';
import { CgpaGauge } from './CgpaGauge';
import { CgpaTrendChart } from './CgpaTrendChart';
import { CourseTable } from './CourseTable';
import { AddCourseModal } from './AddCourseModal';
import { UcamImportModal } from './UcamImportModal';
import { RetakeOptimizer } from './RetakeOptimizer';
import { TargetPlanner } from './TargetPlanner';
import { ProbationRecovery } from './ProbationRecovery';
import {
  calculateAcademicMetrics,
  calculateTrimesterHistory,
  getEffectiveCourses,
  DEMO_TRANSCRIPT_COURSES,
  DEPT_PROFILES,
  exportCSV,
  parseCSV,
} from '../../utils/cgpaUtils';
import { useToast } from '../../context/ToastContext';
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
  CheckCircle2,
  Layers,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function CgpaDashboard({
  courses,
  setCourses,
  settings,
  setSettings,
  onSyncToTuition,
}) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUcamModalOpen, setIsUcamModalOpen] = useState(false);
  const [runningOverrides, setRunningOverrides] = useState({});

  const deptConfig = DEPT_PROFILES[settings.dept] || DEPT_PROFILES.regular;

  // Academic metrics
  const effectiveCourses = useMemo(() => {
    return getEffectiveCourses(courses, runningOverrides);
  }, [courses, runningOverrides]);

  const metrics = useMemo(() => {
    return calculateAcademicMetrics(courses, runningOverrides);
  }, [courses, runningOverrides]);

  const history = useMemo(() => {
    return calculateTrimesterHistory(courses);
  }, [courses]);

  // Handlers
  const handleAddCourse = newCourse => {
    setCourses(prev => [newCourse, ...prev]);
    showToast(`Added ${newCourse.courseId}`, 'success');
  };

  const handleUpdateCourse = (id, updates) => {
    setCourses(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
    showToast('Course updated', 'info');
  };

  const handleDeleteCourse = id => {
    setCourses(prev => prev.filter(c => c.id !== id));
    showToast('Course removed', 'info');
  };

  const handleSetRunningGrade = (courseId, grade) => {
    setRunningOverrides(prev => ({
      ...prev,
      [courseId]: grade,
    }));
  };

  const handleUcamImport = (importedCourses, detectedDept) => {
    setCourses(importedCourses);
    if (detectedDept && detectedDept !== settings.dept) {
      setSettings(prev => ({ ...prev, dept: detectedDept }));
    }
    showToast(`Imported ${importedCourses.length} courses from UCam`, 'success');
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  const handleCSVImport = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = evt.target?.result;
        if (typeof text === 'string') {
          const parsed = parseCSV(text);
          if (parsed.length > 0) {
            setCourses(parsed);
            showToast(`Imported ${parsed.length} courses from CSV`, 'success');
          } else {
            showToast('No courses found in CSV file', 'error');
          }
        }
      } catch (err) {
        showToast('Error reading CSV file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadDemo = () => {
    setCourses(DEMO_TRANSCRIPT_COURSES);
    setRunningOverrides({});
    showToast('Loaded demo UIU transcript', 'info');
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to clear all courses?')) {
      setCourses([]);
      setRunningOverrides({});
      showToast('All course data cleared', 'info');
    }
  };

  const subTabs = [
    { value: 'overview', label: 'Overview & Trend', icon: LineChart },
    { value: 'courses', label: 'All Courses', icon: BookOpen, badge: courses.length },
    { value: 'retake', label: 'Retake Optimizer', icon: Sparkles },
    { value: 'target', label: 'Target Planner', icon: Target },
    { value: 'probation', label: 'Probation Recovery', icon: ShieldAlert },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Deck: Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            CGPA Calculator & Academic Standing
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Retake-aware grade engine enforcing UIU convocation honors & standing rules.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            icon={Upload}
            onClick={() => setIsUcamModalOpen(true)}
          >
            From UCam
          </Button>

          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center font-medium apple-button px-3 py-1.5 text-xs rounded-xl gap-1.5 bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 border border-black/[0.06] dark:border-white/[0.08]">
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
          </label>

          <Button
            size="sm"
            variant="secondary"
            icon={Download}
            onClick={() => exportCSV(courses)}
          >
            Export
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={Sparkles}
            onClick={handleLoadDemo}
            title="Load authentic demo transcript"
          >
            Demo
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            onClick={handleResetData}
            title="Clear all courses"
          />
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="overflow-x-auto pb-1">
        <SegmentedControl
          options={subTabs}
          value={activeTab}
          onChange={setActiveTab}
          size="md"
        />
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* Hero Row: Gauge + KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Circular Gauge Card (4 cols) */}
            <div className="md:col-span-5 lg:col-span-4 flex">
              <div className="w-full">
                <CgpaGauge
                  cgpa={metrics.cgpa}
                  earnedCredits={metrics.earnedCredits}
                  minRequired={settings.programCredits || deptConfig.defaultCredits}
                />
              </div>
            </div>

            {/* KPI Stat Cards (8 cols) */}
            <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Earned Credits */}
              <Card className="p-4 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Earned Credits
                </span>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {metrics.earnedCredits}
                </div>
                <span className="text-[11px] text-zinc-400 mt-1">
                  of {settings.programCredits || deptConfig.defaultCredits} required
                </span>
              </Card>

              {/* CGPA Credits */}
              <Card className="p-4 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Counted Credits
                </span>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {metrics.credits}
                </div>
                <span className="text-[11px] text-zinc-400 mt-1">
                  effective in CGPA
                </span>
              </Card>

              {/* Total Grade Points */}
              <Card className="p-4 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Grade Points
                </span>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-apple-blue tabular-nums">
                  {metrics.points.toFixed(2)}
                </div>
                <span className="text-[11px] text-zinc-400 mt-1">
                  total cumulative
                </span>
              </Card>

              {/* Failed Credits */}
              <Card className="p-4 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Failed Credits
                </span>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                  {metrics.failedCredits}
                </div>
                <span className="text-[11px] text-zinc-400 mt-1">
                  {metrics.failedCredits > 0 ? 'eligible for retake' : 'zero F grades'}
                </span>
              </Card>
            </div>
          </div>

          {/* Academic Progression Curve */}
          <Card>
            <CardHeader
              title="Academic Progress Curve"
              subtitle="Trimester-by-trimester term GPA vs cumulative CGPA progression with probation threshold"
            />
            <CardContent>
              <CgpaTrendChart history={history} minCgpa={deptConfig.minCgpa} />
            </CardContent>
          </Card>

          {/* Quick Course Preview Table */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Course Roster ({courses.length})
              </h3>
              <Button size="xs" variant="secondary" onClick={() => setActiveTab('courses')}>
                View Full Table
              </Button>
            </div>
            <CourseTable
              courses={courses.slice(0, 10)}
              effectiveCourses={effectiveCourses}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onAddCourseClick={() => setIsAddModalOpen(true)}
              runningOverrides={runningOverrides}
              onSetRunningGrade={handleSetRunningGrade}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: COURSES */}
      {activeTab === 'courses' && (
        <CourseTable
          courses={courses}
          effectiveCourses={effectiveCourses}
          onUpdateCourse={handleUpdateCourse}
          onDeleteCourse={handleDeleteCourse}
          onAddCourseClick={() => setIsAddModalOpen(true)}
          runningOverrides={runningOverrides}
          onSetRunningGrade={handleSetRunningGrade}
        />
      )}

      {/* TAB CONTENT: RETAKE OPTIMIZER */}
      {activeTab === 'retake' && (
        <RetakeOptimizer
          courses={courses}
          effectiveCourses={effectiveCourses}
        />
      )}

      {/* TAB CONTENT: TARGET PLANNER */}
      {activeTab === 'target' && (
        <TargetPlanner
          courses={courses}
          totalDegreeCredits={settings.programCredits || deptConfig.defaultCredits}
        />
      )}

      {/* TAB CONTENT: PROBATION RECOVERY */}
      {activeTab === 'probation' && (
        <ProbationRecovery
          courses={courses}
          minCgpa={deptConfig.minCgpa}
          dept={settings.dept}
        />
      )}

      {/* TAB CONTENT: SETTINGS */}
      {activeTab === 'settings' && (
        <Card className="max-w-2xl">
          <CardHeader
            title="Program Configuration"
            subtitle="Configure your degree program profile and departmental regulations"
          />
          <CardContent className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Department / Degree Program
              </label>
              <select
                value={settings.dept}
                onChange={e => {
                  const d = e.target.value;
                  const profile = DEPT_PROFILES[d] || DEPT_PROFILES.regular;
                  setSettings(prev => ({
                    ...prev,
                    dept: d,
                    programCredits: profile.defaultCredits,
                    tuitionPerCredit: profile.defaultTuition,
                  }));
                }}
                className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
              >
                <option value="regular">Regular Program (BSCSE, BBA, BSEE, etc.) — Min CGPA 2.00</option>
                <option value="pharmacy">Pharmacy (B. Pharm.) — Min CGPA 2.50</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Total Required Degree Credits
              </label>
              <input
                type="number"
                value={settings.programCredits}
                onChange={e =>
                  setSettings(prev => ({
                    ...prev,
                    programCredits: parseFloat(e.target.value) || 138,
                  }))
                }
                className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCourse={handleAddCourse}
        defaultTerm={courses[0]?.trimester || '251'}
      />

      <UcamImportModal
        isOpen={isUcamModalOpen}
        onClose={() => setIsUcamModalOpen(false)}
        onImportSuccess={handleUcamImport}
      />
    </div>
  );
}
