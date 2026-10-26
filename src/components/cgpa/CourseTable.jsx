import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  XCircle,
  Edit2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
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
  const [selectedTerm, setSelectedTerm] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Unique trimesters
  const trimesters = useMemo(() => {
    const set = new Set();
    courses.forEach(c => {
      if (c.trimester) set.add(String(c.trimester).trim());
    });
    return Array.from(set).sort().reverse();
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      // Search
      const q = search.toLowerCase();
      const code = (c.courseId || '').toLowerCase();
      const name = (c.courseName || '').toLowerCase();
      const term = String(c.trimester || '').toLowerCase();
      const matchesSearch = !q || code.includes(q) || name.includes(q) || term.includes(q);

      // Term
      const matchesTerm = selectedTerm === 'ALL' || String(c.trimester).trim() === selectedTerm;

      // Status
      const statusInfo = getCourseInCgpaStatus(c, effectiveCourses, runningOverrides);
      let matchesStatus = true;
      if (selectedStatus === 'IN_CGPA') matchesStatus = statusInfo.inCgpa;
      else if (selectedStatus === 'REPLACED') matchesStatus = statusInfo.label === 'Replaced';
      else if (selectedStatus === 'RUNNING') matchesStatus = (c.status || '').toLowerCase().includes('running') || !c.grade;
      else if (selectedStatus === 'PASSED') matchesStatus = GRADE_POINTS[c.grade] > 0;
      else if (selectedStatus === 'FAILED') matchesStatus = c.grade === 'F';

      return matchesSearch && matchesTerm && matchesStatus;
    });
  }, [courses, effectiveCourses, search, selectedTerm, selectedStatus, runningOverrides]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by code (e.g. CSE 1115), title, or term..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
          />
        </div>

        {/* Filters & Add Course Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Trimester Select */}
          <select
            value={selectedTerm}
            onChange={e => setSelectedTerm(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
          >
            <option value="ALL">All Trimesters ({courses.length})</option>
            {trimesters.map(t => (
              <option key={t} value={t}>
                {formatTrimester(t)}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
          >
            <option value="ALL">All Status</option>
            <option value="IN_CGPA">In CGPA Only</option>
            <option value="REPLACED">Replaced Retakes</option>
            <option value="RUNNING">Running Courses</option>
            <option value="PASSED">Passed Courses</option>
            <option value="FAILED">Failed (F) Courses</option>
          </select>

          {/* Add Course */}
          <Button variant="primary" size="sm" icon={Plus} onClick={onAddCourseClick}>
            Add Course
          </Button>
        </div>
      </div>

      {/* Courses Table Container */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Term</th>
                <th className="py-3 px-4">Course Code</th>
                <th className="py-3 px-4">Course Title</th>
                <th className="py-3 px-4 text-center">Cr</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Points</th>
                <th className="py-3 px-4 text-center">In CGPA?</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-zinc-400">
                    No courses match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map(c => {
                  const statusInfo = getCourseInCgpaStatus(c, effectiveCourses, runningOverrides);
                  const effectiveGrade = runningOverrides[c.id] || c.grade;
                  const pts = GRADE_POINTS[effectiveGrade] !== undefined ? GRADE_POINTS[effectiveGrade].toFixed(2) : '—';
                  const isRunning = (c.status || '').toLowerCase().includes('running') || !c.grade;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Trimester */}
                      <td className="py-3 px-4 font-mono font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {c.trimester}
                      </td>

                      {/* Course ID */}
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {c.courseId}
                      </td>

                      {/* Course Name */}
                      <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{c.courseName || '—'}</span>
                          {c.status && !c.status.toLowerCase().includes('running') && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">
                              {c.status}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Credits */}
                      <td className="py-3 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300">
                        {c.credit}
                      </td>

                      {/* Grade Selector / Viewer */}
                      <td className="py-3 px-4 text-center">
                        {isRunning ? (
                          <div className="inline-flex items-center gap-1.5">
                            <select
                              value={runningOverrides[c.id] || ''}
                              onChange={e => onSetRunningGrade(c.id, e.target.value)}
                              className="px-2 py-1 text-xs font-bold rounded-lg border border-apple-blue/40 bg-apple-blue/5 text-apple-blue focus:outline-none focus:ring-1 focus:ring-apple-blue cursor-pointer"
                            >
                              <option value="">Simulate Grade</option>
                              {LETTER_GRADES.map(g => (
                                <option key={g} value={g}>
                                  {g} ({GRADE_POINTS[g].toFixed(2)})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <select
                            value={c.grade || ''}
                            onChange={e => onUpdateCourse(c.id, { grade: e.target.value })}
                            className={`px-2 py-1 text-xs font-bold rounded-lg border text-center transition-colors focus:outline-none ${
                              c.grade === 'F'
                                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400'
                                : c.grade === 'A'
                                ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-300'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-800 dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-zinc-200'
                            }`}
                          >
                            <option value="">—</option>
                            {LETTER_GRADES.map(g => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Grade Point */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                        {pts}
                      </td>

                      {/* In CGPA Status Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onDeleteCourse(c.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] border-t border-black/[0.04] dark:border-white/[0.06] text-xs text-zinc-500">
          <div>
            Showing <b>{filteredCourses.length}</b> of <b>{courses.length}</b> registered courses
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Counted in CGPA
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Replaced by retake
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
