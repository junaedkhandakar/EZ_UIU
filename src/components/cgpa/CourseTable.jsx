import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
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
  if (!grade || grade === 'RUNNING') return '';
  if (grade.startsWith('A')) return 'bg-ok/10 text-ok border-ok/25';
  if (grade.startsWith('B')) return 'bg-sky-500/10 text-sky-500 border-sky-500/25';
  if (grade.startsWith('C')) return 'bg-warn/10 text-warn border-warn/25';
  if (grade.startsWith('D')) return 'bg-orange-500/10 text-orange-500 border-orange-500/25';
  if (grade === 'F') return 'bg-bad/10 text-bad border-bad/25';
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
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[210px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            placeholder="Search code, title or term…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9.5 w-full rounded-xl border border-line bg-surface2/70 py-2 pl-9 pr-3 text-[13px] text-ink placeholder-ink-3 transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <Select value={term} onChange={(e) => setTerm(e.target.value)} className="w-[160px]">
          <option value="ALL">All terms ({courses.length})</option>
          {trimesters.map((t) => (
            <option key={t} value={t}>
              {formatTrimester(t)}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-[150px]">
          <option value="ALL">All status</option>
          <option value="IN_CGPA">In CGPA</option>
          <option value="REPLACED">Replaced</option>
          <option value="RUNNING">Running</option>
          <option value="PASSED">Passed</option>
          <option value="FAILED">Failed</option>
        </Select>
        <Button variant="primary" size="md" icon={Plus} onClick={onAddCourseClick}>
          Add course
        </Button>
      </div>

      {/* table */}
      {filtered.length === 0 ? (
        <Empty
          icon={Search}
          title="No courses match"
          sub="Try a different search term or filter, or add a new course."
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
              <tr className="border-b border-line text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                <th className="px-4 py-3 font-semibold">Term</th>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-3 py-3 text-center font-semibold">Cr</th>
                <th className="px-3 py-3 text-center font-semibold">Grade</th>
                <th className="px-3 py-3 text-center font-semibold">Status</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const st = getCourseInCgpaStatus(c, effectiveCourses, runningOverrides);
                const grade = runningOverrides[c.id] || c.grade;
                const isRunning = !grade || (c.status || '').toLowerCase().includes('running');
                const pts = GRADE_POINTS[grade];
                return (
                  <tr
                    key={c.id}
                    className="group border-b border-line/60 transition-colors last:border-0 hover:bg-surface2/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="num text-[11px] font-semibold text-ink-3">
                        {c.trimester}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-4 py-3">
                      <div className="truncate font-bold text-ink">{c.courseId}</div>
                      <div className="truncate text-[11.5px] text-ink-3">{c.courseName}</div>
                    </td>
                    <td className="num px-3 py-3 text-center font-semibold text-ink-2">
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
                                  {g}
                                </option>
                              ))}
                            </SelectSm>
                            {runningOverrides[c.id] && (
                              <button
                                onClick={() => onSetRunningGrade(c.id, '')}
                                className="rounded-md p-1 text-ink-3 transition-colors hover:bg-surface2 hover:text-ink"
                                title="Clear projection"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span
                            className={`num inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${gradeTone(
                              grade
                            )}`}
                          >
                            {grade}
                            {pts != null && (
                              <span className="ml-1.5 font-medium opacity-60">{pts}</span>
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
                    <td className="px-2 py-3">
                      <button
                        onClick={() => onDeleteCourse(c.id)}
                        className="rounded-lg p-1.5 text-ink-3 opacity-0 transition-all hover:bg-bad/10 hover:text-bad group-hover:opacity-100"
                        title="Delete course"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[11px] text-ink-3">
            <span>
              Showing <span className="num font-semibold text-ink-2">{filtered.length}</span> of{' '}
              <span className="num font-semibold text-ink-2">{courses.length}</span> courses
            </span>
            <span>Grade overrides update CGPA live</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseTable;
