import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, X } from 'lucide-react';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Select, { SelectSm } from '../ui/Select';
import Empty from '../ui/Empty';
import Input from '../ui/Input';
import { type } from '../ui/tokens';
import { gradeTone } from '../../utils/gradeTone';
import {
  GRADE_POINTS,
  LETTER_GRADES,
  formatTrimester,
  getCourseInCgpaStatus,
} from '../../utils/cgpaUtils';

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
      else if (status === 'RUNNING') matchS = st.reason === 'In Progress';
      else if (status === 'PASSED') matchS = (GRADE_POINTS[grade] || 0) > 0;
      else if (status === 'FAILED') matchS = grade === 'F';
      return matchQ && matchT && matchS;
    });
  }, [courses, effectiveCourses, search, term, status, runningOverrides]);

  const filters = [
    { value: 'ALL', label: 'All courses', count: counts.total, tone: 'accent' },
    { value: 'IN_CGPA', label: 'In CGPA', count: effectiveCourses.length, tone: 'ok' },
    { value: 'RUNNING', label: 'Running', count: counts.running, tone: 'accent' },
  ];
  if (counts.failed > 0) {
    filters.push({ value: 'FAILED', label: 'Failed retakes', count: counts.failed, tone: 'bad' });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {filters.map((f) => (
          <Chip
            key={f.value}
            active={status === f.value}
            tone={f.tone}
            size="sm"
            onClick={() => setStatus(f.value)}
          >
            {f.label}
            <span className="num font-bold">{f.count}</span>
          </Chip>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Search code, title or term…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
          onClear={() => setSearch('')}
          wrapperClassName="min-w-[220px] flex-1"
        />
        <Select value={term} onChange={(e) => setTerm(e.target.value)} className="w-[170px]">
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
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className={`border-b border-line bg-surface2/60 ${type.eyebrow}`}>
                  <th className="px-4 py-2.5 font-semibold">Term</th>
                  <th className="px-4 py-2.5 font-semibold">Course code &amp; title</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Credits</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Grade</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Standing</th>
                  <th className="w-10 px-2 py-2.5" />
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
                        className="group border-b border-line/60 transition-colors last:border-0 hover:bg-surface2/50"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <span className="num font-mono text-[11px] font-bold text-ink-3">
                            {c.trimester}
                          </span>
                        </td>
                        <td className="max-w-[300px] px-4 py-2.5">
                          <div className="truncate font-semibold tracking-tight text-ink">
                            {c.courseId}
                          </div>
                          <div className="truncate text-[11.5px] text-ink-3">{c.courseName}</div>
                        </td>
                        <td className="num px-3 py-2.5 text-center font-semibold text-ink-2">
                          {c.credit}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-center">
                            {isRunning ? (
                              <div className="flex items-center gap-1">
                                <SelectSm
                                  value={runningOverrides[c.id] || ''}
                                  onChange={(e) => onSetRunningGrade(c.id, e.target.value)}
                                  className="w-[104px]"
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
                                    aria-label="Clear projection"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span
                                className={`num inline-flex items-center rounded-md border px-2 py-[3px] text-[11.5px] font-bold ${gradeTone(
                                  grade
                                )}`}
                              >
                                {grade}
                                {pts != null && (
                                  <span className="ml-1 text-[10px] font-semibold opacity-70">
                                    {pts.toFixed(2)}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                st.inCgpa
                                  ? 'bg-ok'
                                  : st.label === 'Replaced'
                                    ? 'bg-warn'
                                    : st.reason === 'In Progress'
                                      ? 'bg-accent live-dot'
                                      : 'bg-ink-3'
                              }`}
                            />
                            <span className="text-[11.5px] font-medium text-ink-2">
                              {st.inCgpa ? 'In CGPA' : st.label === 'Replaced' ? 'Replaced' : st.reason}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <button
                            onClick={() => onDeleteCourse(c.id)}
                            className="rounded-md p-1.5 text-ink-3 opacity-0 transition-[opacity,color,background-color] duration-150 hover:bg-bad/10 hover:text-bad focus-visible:opacity-100 group-hover:opacity-100"
                            title="Delete course"
                            aria-label={`Delete ${c.courseId}`}
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
          </div>
          <div className="flex items-center justify-between border-t border-line bg-surface2/40 px-4 py-2 text-[11px] text-ink-3">
            <span>
              Showing <span className="num font-semibold text-ink-2">{filtered.length}</span> of{' '}
              <span className="num font-semibold text-ink-2">{courses.length}</span> recorded courses
            </span>
            <span className="hidden sm:inline">Retakes replace the old grade in CGPA</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseTable;
