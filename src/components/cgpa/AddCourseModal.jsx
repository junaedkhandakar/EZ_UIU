import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { COURSE_CATALOG } from '../../data/courseCatalog';
import { LETTER_GRADES, GRADE_POINTS } from '../../utils/cgpaUtils';

export function AddCourseModal({ isOpen, onClose, onAddCourse, defaultTerm = '251' }) {
  const [trimester, setTrimester] = useState(defaultTerm);
  const [courseId, setCourseId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [credit, setCredit] = useState(3);
  const [grade, setGrade] = useState('');
  const [status, setStatus] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleCodeChange = val => {
    setCourseId(val);
    const q = val.trim().toLowerCase();
    if (q.length >= 2) {
      const matches = COURSE_CATALOG.filter(c =>
        c.course_code.toLowerCase().includes(q) || c.course_name.toLowerCase().includes(q)
      ).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = c => {
    setCourseId(c.course_code);
    setCourseName(c.course_name);
    setCredit(c.credit || 3);
    setSuggestions([]);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!courseId.trim()) return;

    onAddCourse({
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      trimester: trimester.trim() || '251',
      courseId: courseId.trim().toUpperCase(),
      courseName: courseName.trim() || courseId.trim().toUpperCase(),
      credit: parseFloat(credit) || 3,
      grade: grade,
      status: status,
    });

    // Reset & Close
    setCourseId('');
    setCourseName('');
    setCredit(3);
    setGrade('');
    setStatus('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Course Entry"
      subtitle="Type a course code for autocomplete from the official curriculum"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Trimester */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Trimester Code (e.g. 233, 241, 242, 251)
          </label>
          <input
            type="text"
            required
            value={trimester}
            onChange={e => setTrimester(e.target.value)}
            placeholder="251"
            className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 font-mono"
          />
        </div>

        {/* Course Code with live autocomplete */}
        <div className="relative">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Course Code (e.g. CSE 1115, MATH 1151)
          </label>
          <input
            type="text"
            required
            value={courseId}
            onChange={e => handleCodeChange(e.target.value)}
            placeholder="Type code or subject..."
            className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 font-semibold uppercase"
          />
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-[#252528] rounded-xl shadow-xl border border-black/[0.08] dark:border-white/[0.1] overflow-hidden">
              {suggestions.map(s => (
                <div
                  key={s.course_code}
                  onClick={() => selectSuggestion(s)}
                  className="px-3.5 py-2 text-xs hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-apple-blue mr-2">{s.course_code}</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{s.course_name}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400">{s.credit} cr</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Title */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Course Title / Name
          </label>
          <input
            type="text"
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            placeholder="Object Oriented Programming"
            className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
          />
        </div>

        {/* Credits & Grade */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Credits
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              required
              value={credit}
              onChange={e => setCredit(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Grade (leave blank if running)
            </label>
            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
            >
              <option value="">No Grade (Running)</option>
              {LETTER_GRADES.map(g => (
                <option key={g} value={g}>
                  {g} ({GRADE_POINTS[g].toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Option */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Status (Optional)
          </label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
          >
            <option value="">Regular Completed</option>
            <option value="Running Course">Running Course</option>
            <option value="Withdraw">Withdraw (W)</option>
            <option value="Dropped">Dropped (Dp)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Course
          </Button>
        </div>
      </form>
    </Modal>
  );
}
