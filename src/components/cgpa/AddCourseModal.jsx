import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Input, { Field } from '../ui/Input';
import { COURSE_CATALOG } from '../../data/courseCatalog';
import { LETTER_GRADES, GRADE_POINTS, formatTrimester } from '../../utils/cgpaUtils';

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
      credit: Math.round(parseFloat(credit)) || 3,
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
          <Field label="Term" hint={formatTrimester(trimester)}>
            <Input
              type="text"
              required
              value={trimester}
              onChange={(e) => setTrimester(e.target.value)}
              placeholder="251"
              className="num font-mono font-semibold uppercase"
            />
          </Field>
          <div className="relative">
            <Field label="Course code">
              <Input
                type="text"
                required
                value={courseId}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="CSE 1115"
                className="font-bold uppercase"
                autoComplete="off"
              />
            </Field>
            {suggestions.length > 0 && (
              <div className="fade-in absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
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

        <Field label="Course title">
          <Input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Object Oriented Programming"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Credits">
            <Input
              type="number"
              step="1"
              min="1"
              max="12"
              required
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              className="num font-mono font-semibold"
            />
          </Field>
          <Field label="Grade — blank if running">
            <div className="flex flex-wrap gap-1.5">
              <Chip active={grade === ''} onClick={() => setGrade('')}>
                Running
              </Chip>
              {LETTER_GRADES.map((g) => (
                <Chip
                  key={g}
                  active={grade === g}
                  onClick={() => setGrade(g)}
                  className="num w-9 justify-center px-0"
                >
                  {g}
                </Chip>
              ))}
            </div>
          </Field>
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
