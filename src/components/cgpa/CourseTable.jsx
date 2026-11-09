import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, X, CheckCircle, Clock, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import Button from '../ui/Button';
import Select, { SelectSm } from '../ui/Select';
import Empty from '../ui/Empty';
import {
  GRADE_POINTS,
  LETTER_GRADES,
  formatTrimester,
  getCourseInCgpaStatus,
} from '../../utils/cgpaUtils';

export function gradeTone(g) {
  const grade = String(g || '').toUpperCase();
  if (!grade || grade === 'RUNNING') return 'bg-surface2 text-ink-3 border-line';
  if (grade.startsWith('A')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
  if (grade.startsWith('B')) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25';
  if (grade.startsWith('C')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
  if (grade.startsWith('D')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25';
  if (grade === 'F') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
  return 'bg-surface2 text-ink-3 border-line';
}

export function CourseTable({
  courses = [],
  effectiveCourses = [],
  onUpdateCourse,
  onDeleteCourse,
  onAddCourseClick,
  runningOverrides = {},
  onSetRunningGrade,
}) {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const trimesters = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => c.trimester && set.add(String(c.trimester).trim()));
    return Array.from(set).sort().reverse();
  }, [courses]);

  const counts = useMemo(() => {
    let passed = 0;
    let failed = 0;
    let running = 0;
    courses.forEach((c) => {
      const g = runningOverrides[c.id] || c.grade;
      if (!g || (c.status || '').toLowerCase().includes('running')) running++;
      else if (g === 'F') failed++;
      else if (GRADE_POINTS[g] > 0) passed++;
    });
    return { passed, failed, running, total: courses.length };
  }, [courses, runningOverrides]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return courses.filter((c) => {
      const matchQ =
        !q ||
        (c.courseId || '').toLowerCase().includes(q) ||
        (c.courseName || '').toLowerCase().includes(q) ||
        String(c.trimester || '').toLowerCase().includes(q);
      const matchT = term === 'ALL' || String(c.trimester).trim() === term;
      const st = getCourseInCgpaStatus(c, effectiveCourses, runningOverrides);
      const grade = runningOverrides[c.id] || c.grade;
      let matchS = true;
      if (status === 'IN_CGPA') matchS = st.inCgpa;
      else if (status === 'REPLACED') matchS = st.label === 'Replaced';
      else if (status === 'RUNNING') matchS = (c.status || '').toLowerCase().includes('running') || !grade;
      else if (status === 'PASSED') matchS = (GRADE_POINTS[grade] || 0) > 0;
      else if (status === 'FAILED') matchS = grade === 'F';
      return matchQ && matchT && matchS;
    });
  }, [courses, effectiveCourses, search, term, status, runningOverrides]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Quick Filter Counts */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatus('ALL')}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
            status === 'ALL'
              ? 'border-accent bg-accentSoft text-accent'
              : 'border-line bg-surface text-ink-3 hover:text-ink'
          }`}
        >
          All Courses <span className="num font-bold">({counts.total})</span>
        </button>
        <button
          onClick={() => setStatus('IN_CGPA')}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
            status === 'IN_CGPA'
              ? 'border-ok/40 bg-ok/10 text-ok'
              : 'border-line bg-surface text-ink-3 hover:text-ink'
          }`}
        >
          In CGPA <span className="num font-bold">({effectiveCourses.length})</span>
        </button>
        <button
          onClick={() => setStatus('RUNNING')}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
            status === 'RUNNING'
              ? 'border-accent/40 bg-accentSoft text-accent'
              : 'border-line bg-surface text-ink-3 hover:text-ink'
          }`}
        >
          Running <span className="num font-bold">({counts.running})</span>
        </button>
        {counts.failed > 0 && (
          <button
            onClick={() => setStatus('FAILED')}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              status === 'FAILED'
                ? 'border-bad/40 bg-bad/10 text-bad'
                : 'border-line bg-surface text-ink-3 hover:text-ink'
            }`}
          >
            Failed Retakes <span className="num font-bold">({counts.failed})</span>
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[210px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            placeholder="Search code (e.g. CSE 1115), title or term…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[38px] w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-8 text-[13px] text-ink placeholder-ink-3 transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-3 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select value={term} onChange={(e) => setTerm(e.target.value)} className="w-[160px]">
          <option value="ALL">All terms ({courses.length})</option>
          {trimesters.map((t) => (
            <option key={t} value={t}>
              {formatTrimester(t)}
            </option>
          ))}
        </Select>
        <Button variant="primary" size="md" icon={Plus} onClick={onAddCourseClick}>
          Add course
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Empty
          icon={Search}
          title="No courses match your query"
          sub="Try adjusting your search terms or filters, or add a course."
          action={
            <Button variant="secondary" size="sm" icon={Plus} onClick={onAddCourseClick}>
              Add course
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                <th className="px-4 py-3 font-semibold">Term</th>
                <th className="px-4 py-3 font-semibold">Course Code & Title</th>
                <th className="px-3 py-3 text-center font-semibold">Credits</th>
                <th className="px-3 py-3 text-center font-semibold">Grade</th>
                <th className="px-3 py-3 text-center font-semibold">Standing</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((c) => {
                  const st = getCourseInCgpaStatus(c, effectiveCourses, runningOverrides);
                  const grade = runningOverrides[c.id] || c.grade;
                  const isRunning = !grade || (c.status || '').toLowerCase().includes('running');
                  const pts = GRADE_POINTS[grade];
                  return (
                    <motion.tr
                      key={c.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="group border-b border-line/60 transition-colors last:border-0 hover:bg-surface2/60"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="num font-mono text-[11px] font-bold text-ink-3">
                          {c.trimester}
                        </span>
                      </td>
                      <td className="max-w-[280px] px-4 py-3">
                        <div className="truncate font-bold tracking-tight text-ink">{c.courseId}</div>
                        <div className="truncate text-[11.5px] text-ink-3">{c.courseName}</div>
                      </td>
                      <td className="num px-3 py-3 text-center font-bold text-ink-2">
                        {c.credit}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-center">
                          {isRunning ? (
                            <div className="flex items-center gap-1.5">
                              <SelectSm
                                value={runningOverrides[c.id] || ''}
                                onChange={(e) => onSetRunningGrade(c.id, e.target.value)}
                                className="w-[108px]"
                              >
                                <option value="">Projected…</option>
                                {LETTER_GRADES.map((g) => (
                                  <option key={g} value={g}>
                                    {g} ({GRADE_POINTS[g].toFixed(2)})
                                  </option>
                                ))}
                              </SelectSm>
                              {runningOverrides[c.id] && (
                                <button
                                  onClick={() => onSetRunningGrade(c.id, '')}
                                  className="rounded-md p-1 text-ink-3 transition-colors hover:bg-surface2 hover:text-ink"
                                  title="Clear projection"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span
                              className={`num inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-extrabold ${gradeTone(
                                grade
                              )}`}
                            >
                              {grade}
                              {pts != null && (
                                <span className="ml-1.5 text-[10.5px] font-semibold opacity-70">
                                  {pts.toFixed(2)}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              st.label === 'In CGPA'
                                ? 'bg-ok'
                                : st.label === 'Replaced'
                                  ? 'bg-warn'
                                  : st.label === 'Running'
                                    ? 'bg-accent pulse-dot'
                                    : 'bg-ink-3'
                            }`}
                          />
                          <span className="text-[11.5px] font-medium text-ink-2">{st.label}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <button
                          onClick={() => onDeleteCourse(c.id)}
                          className="rounded-lg p-1.5 text-ink-3 opacity-0 transition-[opacity,color,background-color] duration-150 hover:bg-bad/10 hover:text-bad group-hover:opacity-100"
                          title="Delete course"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-line bg-surface2/30 px-4 py-2.5 text-[11px] text-ink-3">
            <span>
              Showing <span className="num font-semibold text-ink-2">{filtered.length}</span> of{' '}
              <span className="num font-semibold text-ink-2">{courses.length}</span> recorded courses
            </span>
            <span>Live retake recalculations enforced</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseTable;
