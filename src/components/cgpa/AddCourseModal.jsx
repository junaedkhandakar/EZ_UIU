import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { COURSE_CATALOG } from '../../data/courseCatalog';
import { LETTER_GRADES, GRADE_POINTS, formatTrimester } from '../../utils/cgpaUtils';

const inputCls =
  'w-full rounded-xl border border-line bg-surface2/70 px-3.5 py-2.5 text-[13px] text-ink placeholder-ink-3 transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40';

const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3';

export function AddCourseModal({ isOpen, onClose, onAddCourse, defaultTerm = '251' }) {
  const [trimester, setTrimester] = useState(defaultTerm);
  const [courseId, setCourseId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [credit, setCredit] = useState(3);
  const [grade, setGrade] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleCodeChange = (val) => {
    setCourseId(val);
    const q = val.trim().toLowerCase();
    if (q.length >= 2) {
      setSuggestions(
        COURSE_CATALOG.filter(
          (c) => c.course_code.toLowerCase().includes(q) || c.course_name.toLowerCase().includes(q)
        ).slice(0, 6)
      );
    } else setSuggestions([]);
  };

  const selectSuggestion = (c) => {
    setCourseId(c.course_code);
    setCourseName(c.course_name);
    setCredit(c.credit || 3);
    setSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseId.trim()) return;
    onAddCourse({
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      trimester: trimester.trim() || '251',
      courseId: courseId.trim().toUpperCase(),
      courseName: courseName.trim() || courseId.trim().toUpperCase(),
      credit: parseFloat(credit) || 3,
      grade,
      status: grade ? '' : 'Running',
    });
    setCourseId('');
    setCourseName('');
    setCredit(3);
    setGrade('');
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Add course"
      sub="Autocomplete pulls from the official UIU curriculum"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <div>
            <label className={labelCls}>Term</label>
            <input
              type="text"
              required
              value={trimester}
              onChange={(e) => setTrimester(e.target.value)}
              placeholder="251"
              className={`${inputCls} num font-mono font-semibold uppercase`}
            />
            <p className="mt-1.5 text-[10.5px] text-ink-3">{formatTrimester(trimester)}</p>
          </div>
          <div className="relative">
            <label className={labelCls}>Course code</label>
            <input
              type="text"
              required
              value={courseId}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="CSE 1115"
              className={`${inputCls} font-bold uppercase`}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-pop fade-in">
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={s.course_code}
                    onClick={() => selectSuggestion(s)}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors last:border-0 hover:bg-surface2"
                  >
                    <span className="truncate">
                      <span className="mr-2 font-bold text-accent">{s.course_code}</span>
                      <span className="text-xs text-ink-2">{s.course_name}</span>
                    </span>
                    <span className="num shrink-0 text-[10px] font-semibold text-ink-3">
                      {s.credit} cr
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className={labelCls}>Course title</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Object Oriented Programming"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Credits</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              required
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              className={`${inputCls} num font-mono font-semibold`}
            />
          </div>
          <div>
            <label className={labelCls}>Grade — blank if running</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setGrade('')}
                className={`h-9.5 rounded-xl border px-3 text-xs font-bold transition-all active:scale-95 ${
                  grade === ''
                    ? 'border-accent bg-accentSoft text-accent'
                    : 'border-line bg-surface2/70 text-ink-3 hover:text-ink'
                }`}
              >
                Running
              </button>
              {LETTER_GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`num h-9.5 w-9 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                    grade === g
                      ? 'border-accent bg-accentSoft text-accent'
                      : 'border-line bg-surface2/70 text-ink-2 hover:text-ink'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-1 flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Add to transcript
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddCourseModal;
