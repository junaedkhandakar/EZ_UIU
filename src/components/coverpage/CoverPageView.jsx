import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Printer,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Users,
  User,
  Check,
  Sparkles,
  Building2,
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  Eye,
  FileCheck2,
  X,
} from 'lucide-react';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import Select from '../ui/Select';
import { useToast } from '../../context/ToastContext';
import { COURSE_CATALOG } from '../../data/courseCatalog';
import { UIU_LOGO_BASE64 } from '../../data/uiuLogoBase64';

const STORAGE_COVERPAGE_KEY = 'ez_uiu_coverpage_v3';
const THEME_ORANGE = '#f97316';
const UNIVERSITY_NAME = 'United International University';

const DEPARTMENTS = [
  'Department of Computer Science and Engineering',
  'Department of Electrical and Electronic Engineering',
  'Department of Civil Engineering',
  'School of Business and Economics',
  'Department of Economics',
  'Department of English',
  'Department of Pharmacy',
  'Department of Environment and Development Studies',
  'Department of Media Studies and Journalism',
  'Department of Biotechnology and Genetic Engineering',
];

const FACULTY_DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Senior Lecturer',
  'Lecturer',
  'Adjunct Faculty',
  'Course Instructor',
];

const DOC_TYPES = [
  { id: 'assignment', label: 'Assignment', icon: '📝', defaultTitle: 'Assignment' },
  { id: 'lab', label: 'Lab Report', icon: '🧪', defaultTitle: 'Lab Report' },
  { id: 'project', label: 'Project Report', icon: '📊', defaultTitle: 'Project Report' },
  { id: 'termpaper', label: 'Term Paper', icon: '📚', defaultTitle: 'Term Paper' },
  { id: 'thesis', label: 'Thesis / Internship', icon: '🎓', defaultTitle: 'Thesis Report' },
  { id: 'presentation', label: 'Presentation Report', icon: '🎤', defaultTitle: 'Presentation' },
  { id: 'answer', label: 'Answer Script', icon: '✍️', defaultTitle: 'Answer Script' },
  { id: 'labindex', label: 'Lab Index Page', icon: '🗂️', defaultTitle: 'Lab Index' },
];

export default function CoverPageView() {
  const { showToast } = useToast();
  const printAreaRef = useRef(null);

  const [docType, setDocType] = useState('assignment');
  const [template, setTemplate] = useState('classic'); // 'classic' | 'modern' | 'professional' | 'elegant'
  const [isGroup, setIsGroup] = useState(false);

  // Form Fields
  const [docNumber, setDocNumber] = useState('01');
  const [topicTitle, setTopicTitle] = useState('Heuristic Evaluation of User Interfaces');
  const [submissionDate, setSubmissionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [performanceDate, setPerformanceDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [courseCode, setCourseCode] = useState('CSE 4451');
  const [courseTitle, setCourseTitle] = useState('Human Computer Interaction');
  const [courseSection, setCourseSection] = useState('C');
  const [trimester, setTrimester] = useState('Fall 2026');

  const [facultyName, setFacultyName] = useState('Dr. Mohammad Nurul Huda');
  const [facultyDesignation, setFacultyDesignation] = useState('Professor');
  const [facultyDept, setFacultyDept] = useState('Department of Computer Science and Engineering');

  const [students, setStudents] = useState([
    { name: 'Md. Junaed Khandakar', id: '0112330072', section: 'C', program: 'B.Sc. in Computer Science and Engineering' },
  ]);

  // Lab Index specific experiments
  const [indexRows, setIndexRows] = useState([
    { name: 'Familiarization with Operating System Commands', date: '2026-10-28', page: '1-6' },
    { name: 'Implementation of CPU Scheduling Algorithms (FCFS, SJF)', date: '2026-11-04', page: '7-14' },
    { name: 'Thread Synchronization and Deadlock Avoidance', date: '2026-11-11', page: '15-22' },
  ]);

  // Load saved progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COVERPAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.docType) setDocType(d.docType);
        if (d.template) setTemplate(d.template);
        if (d.docNumber) setDocNumber(d.docNumber);
        if (d.topicTitle) setTopicTitle(d.topicTitle);
        if (d.submissionDate) setSubmissionDate(d.submissionDate);
        if (d.courseCode) setCourseCode(d.courseCode);
        if (d.courseTitle) setCourseTitle(d.courseTitle);
        if (d.courseSection) setCourseSection(d.courseSection);
        if (d.trimester) setTrimester(d.trimester);
        if (d.facultyName) setFacultyName(d.facultyName);
        if (d.facultyDesignation) setFacultyDesignation(d.facultyDesignation);
        if (d.facultyDept) setFacultyDept(d.facultyDept);
        if (d.isGroup !== undefined) setIsGroup(d.isGroup);
        if (d.students?.length) setStudents(d.students);
        if (d.indexRows?.length) setIndexRows(d.indexRows);
      }
    } catch {}
  }, []);

  // Save changes locally on every change
  useEffect(() => {
    try {
      const payload = {
        docType,
        template,
        docNumber,
        topicTitle,
        submissionDate,
        courseCode,
        courseTitle,
        courseSection,
        trimester,
        facultyName,
        facultyDesignation,
        facultyDept,
        isGroup,
        students,
        indexRows,
      };
      localStorage.setItem(STORAGE_COVERPAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [
    docType,
    template,
    docNumber,
    topicTitle,
    submissionDate,
    courseCode,
    courseTitle,
    courseSection,
    trimester,
    facultyName,
    facultyDesignation,
    facultyDept,
    isGroup,
    students,
    indexRows,
  ]);

  const activeDocConfig = useMemo(
    () => DOC_TYPES.find((d) => d.id === docType) || DOC_TYPES[0],
    [docType]
  );

  const handleAddStudent = () => {
    if (students.length >= 6) {
      showToast('Maximum 6 group members', 'info');
      return;
    }
    setStudents([
      ...students,
      { name: '', id: '', section: courseSection, program: students[0]?.program || 'B.Sc. in Computer Science and Engineering' },
    ]);
  };

  const handleRemoveStudent = (idx) => {
    if (students.length <= 1) return;
    setStudents(students.filter((_, i) => i !== idx));
  };

  const handleStudentChange = (idx, field, val) => {
    const updated = [...students];
    updated[idx][field] = val;
    setStudents(updated);
  };

  const handleAddIndexRow = () => {
    if (indexRows.length >= 15) {
      showToast('Maximum 15 experiments on one page', 'info');
      return;
    }
    setIndexRows([...indexRows, { name: '', date: submissionDate, page: '' }]);
  };

  const handleRemoveIndexRow = (idx) => {
    if (indexRows.length <= 1) return;
    setIndexRows(indexRows.filter((_, i) => i !== idx));
  };

  const handleIndexRowChange = (idx, field, val) => {
    const updated = [...indexRows];
    updated[idx][field] = val;
    setIndexRows(updated);
  };

  const handleSelectCatalogCourse = (code) => {
    const c = COURSE_CATALOG.find((item) => item.course_code === code);
    if (c) {
      setCourseCode(c.course_code);
      setCourseTitle(c.course_name);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDoc = () => {
    if (!printAreaRef.current) return;
    try {
      const pageHtml = printAreaRef.current.innerHTML;
      const fullDocHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${courseCode} ${activeDocConfig.label} Cover Page</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #111; line-height: 1.4; }
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 6px; }
            .font-bold { font-weight: bold; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <div style="width: 210mm; min-height: 297mm; padding: 15mm; box-sizing: border-box;">
            ${pageHtml}
          </div>
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff', fullDocHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UIU_${activeDocConfig.label.replace(/\s+/g, '_')}_${courseCode.replace(/\s+/g, '_')}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported editable Word document with official logo!', 'success');
    } catch {
      showToast('Error exporting Word file', 'error');
    }
  };

  const formattedSubmissionDate = useMemo(() => {
    try {
      const d = new Date(submissionDate + 'T00:00:00');
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return submissionDate;
    }
  }, [submissionDate]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-accent" />
            UIU Assignment & Lab Cover Page Studio
          </h1>
          <p className="mt-0.5 text-xs text-ink-3">
            Official UIU emblem, authentic department formats, auto-saved in your browser, vector A4 print & Word export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={Download} onClick={handleDownloadDoc}>
            Download Word (.doc)
          </Button>
          <Button variant="primary" icon={Printer} onClick={handlePrint}>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ================= LEFT CONTROLS ================= */}
        <div className="flex flex-col gap-4 lg:col-span-5 no-print">
          {/* Document Type Selector */}
          <Surface className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h3 className="text-sm font-bold text-ink">Submission Type</h3>
              <div className="flex rounded-lg border border-line bg-surface2 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setIsGroup(false)}
                  className={`flex items-center gap-1 rounded px-2.5 py-1 font-semibold transition-colors ${
                    !isGroup ? 'bg-surface text-accent shadow-sm' : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  <User className="h-3 w-3" /> Individual
                </button>
                <button
                  type="button"
                  onClick={() => setIsGroup(true)}
                  className={`flex items-center gap-1 rounded px-2.5 py-1 font-semibold transition-colors ${
                    isGroup ? 'bg-surface text-accent shadow-sm' : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  <Users className="h-3 w-3" /> Group
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => setDocType(dt.id)}
                  className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                    docType === dt.id
                      ? 'border-accent bg-accentSoft text-accent font-bold shadow-sm'
                      : 'border-line bg-surface2/50 text-ink-3 hover:text-ink hover:bg-surface2'
                  }`}
                >
                  <span className="text-sm">{dt.icon}</span>
                  <span className="truncate">{dt.label}</span>
                </button>
              ))}
            </div>

            {/* Template Selector (only if not lab index) */}
            {docType !== 'labindex' && (
              <div className="pt-2 border-t border-line">
                <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                  Design Template
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'classic', label: 'Classic', desc: 'Faculty standard' },
                    { id: 'modern', label: 'Modern', desc: 'Header banner' },
                    { id: 'professional', label: 'Bordered', desc: 'Outer frame' },
                    { id: 'elegant', label: 'Elegant', desc: 'Double border' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        template === t.id
                          ? 'border-accent bg-accentSoft text-accent font-bold shadow-sm'
                          : 'border-line bg-surface2/50 text-ink-3 hover:text-ink'
                      }`}
                    >
                      <div className="text-xs font-bold">{t.label}</div>
                      <div className="text-[9px] opacity-75">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Surface>

          {/* Course Details */}
          <Surface className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h3 className="text-sm font-bold text-ink">Course Details</h3>
              <Select
                value=""
                onChange={(e) => handleSelectCatalogCourse(e.target.value)}
                className="w-[170px]"
              >
                <option value="">Auto-fill from UIU Catalog…</option>
                {COURSE_CATALOG.map((c) => (
                  <option key={c.course_code} value={c.course_code}>
                    {c.course_code} · {c.course_name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CSE 4451"
                  className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-mono font-bold text-ink outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  Course Section
                </label>
                <input
                  type="text"
                  value={courseSection}
                  onChange={(e) => setCourseSection(e.target.value)}
                  placeholder="e.g. C, 01"
                  className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-bold text-ink outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Course Title
              </label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. Human Computer Interaction"
                className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-medium text-ink outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  {docType === 'lab' ? 'Experiment No.' : 'Assignment / Report No.'}
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. 01, Final"
                  className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-mono font-bold text-ink outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  Trimester
                </label>
                <input
                  type="text"
                  value={trimester}
                  onChange={(e) => setTrimester(e.target.value)}
                  placeholder="e.g. Fall 2026"
                  className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-medium text-ink outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Topic / Experiment Name
              </label>
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="e.g. Implementation and Comparative Analysis"
                className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-medium text-ink outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Submission Date
              </label>
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-medium text-ink outline-none focus:border-accent"
              />
            </div>
          </Surface>

          {/* Faculty (Submitted To) */}
          <Surface className="space-y-3">
            <h3 className="text-sm font-bold text-ink border-b border-line pb-2.5">
              Faculty Information (Submitted To)
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  Faculty Name
                </label>
                <input
                  type="text"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-semibold text-ink outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  Designation
                </label>
                <Select
                  value={facultyDesignation}
                  onChange={(e) => setFacultyDesignation(e.target.value)}
                >
                  {FACULTY_DESIGNATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Department
              </label>
              <Select value={facultyDept} onChange={(e) => setFacultyDept(e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
          </Surface>

          {/* Student Information (Submitted By) */}
          <Surface className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h3 className="text-sm font-bold text-ink">
                {isGroup ? `Group Members (${students.length})` : 'Student Information (Submitted By)'}
              </h3>
              {isGroup && (
                <button
                  type="button"
                  onClick={handleAddStudent}
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Member
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {students.map((st, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-line bg-surface2/40 p-3 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                      {isGroup ? `Member #${idx + 1}` : 'Student'}
                    </span>
                    {isGroup && students.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(idx)}
                        className="text-ink-3 hover:text-bad p-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => handleStudentChange(idx, 'name', e.target.value)}
                      placeholder="Student Full Name"
                      className="h-8 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      value={st.id}
                      onChange={(e) => handleStudentChange(idx, 'id', e.target.value)}
                      placeholder="Student ID (011...)"
                      className="h-8 rounded-lg border border-line bg-surface px-2.5 font-mono text-xs text-ink outline-none focus:border-accent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Surface>

          {/* Lab Index Row Manager (if docType === 'labindex') */}
          {docType === 'labindex' && (
            <Surface className="space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <h3 className="text-sm font-bold text-ink">Lab Index Experiments</h3>
                <button
                  type="button"
                  onClick={handleAddIndexRow}
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Experiment
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {indexRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2 text-xs">
                    <span className="w-5 text-center font-bold text-ink-3">{rIdx + 1}</span>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => handleIndexRowChange(rIdx, 'name', e.target.value)}
                      placeholder="Experiment Name"
                      className="h-8 flex-1 rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      value={row.page}
                      onChange={(e) => handleIndexRowChange(rIdx, 'page', e.target.value)}
                      placeholder="Page"
                      className="h-8 w-16 rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-accent font-mono text-center"
                    />
                    {indexRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIndexRow(rIdx)}
                        className="p-1 text-ink-3 hover:text-bad"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Surface>
          )}
        </div>

        {/* ================= RIGHT: LIVE TRUE A4 PRINT PREVIEW ================= */}
        <div className="flex flex-col items-center lg:col-span-7">
          <div className="w-full flex items-center justify-between px-2 pb-2 text-xs text-ink-3 no-print">
            <span className="font-semibold flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-accent" />
              Live A4 Vector Preview (Exact UIU Standard)
            </span>
            <span className="font-mono text-[11px]">210 × 297 mm</span>
          </div>

          {/* A4 Sheet Container */}
          <div
            id="cover-page-print-container"
            ref={printAreaRef}
            className="w-full max-w-[560px] aspect-[1/1.4142] bg-white text-zinc-900 rounded-lg shadow-2xl p-10 sm:p-14 flex flex-col justify-between border border-zinc-200 overflow-hidden select-text relative"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              color: '#111827',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Template Variant 1: CLASSIC (Official Faculty Standard) */}
            {docType !== 'labindex' && template === 'classic' && (
              <div className="h-full flex flex-col justify-between">
                {/* Official Logo Header */}
                <div className="text-center pt-2">
                  <img
                    src={UIU_LOGO_BASE64}
                    alt="United International University"
                    className="mx-auto h-16 sm:h-20 max-w-[280px] sm:max-w-[320px] object-contain"
                  />
                </div>

                {/* Document Title & Course Block */}
                <div className="text-center space-y-4 my-auto py-6">
                  <div
                    className="text-2xl sm:text-3xl font-bold uppercase tracking-wider"
                    style={{ color: THEME_ORANGE, letterSpacing: '2px' }}
                  >
                    {activeDocConfig.defaultTitle.toUpperCase()}
                  </div>

                  <div className="text-lg sm:text-xl font-bold text-zinc-900 leading-tight">
                    {courseTitle || 'Course Title'}
                  </div>

                  <div className="inline-block text-left text-xs sm:text-sm font-semibold space-y-1.5 text-zinc-800 pt-2">
                    <div>
                      <span className="text-zinc-500">Course Code:</span> {courseCode}
                    </div>
                    {courseSection && (
                      <div>
                        <span className="text-zinc-500">Course Section:</span> {courseSection}
                      </div>
                    )}
                    {docNumber && (
                      <div>
                        <span className="text-zinc-500">
                          {docType === 'lab' ? 'Experiment No:' : 'Assignment No:'}
                        </span>{' '}
                        {docNumber}
                      </div>
                    )}
                    {topicTitle && (
                      <div className="max-w-md">
                        <span className="text-zinc-500">Topic:</span> {topicTitle}
                      </div>
                    )}
                    <div>
                      <span className="text-zinc-500">Date of Submission:</span> {formattedSubmissionDate}
                    </div>
                  </div>
                </div>

                {/* Submitted By / Submitted To Grid */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-zinc-900 text-xs sm:text-sm">
                  {/* Submitted By */}
                  <div>
                    <div
                      className="text-sm sm:text-base font-bold uppercase tracking-wider mb-2"
                      style={{ color: THEME_ORANGE }}
                    >
                      Submitted By:
                    </div>
                    {students.map((st, i) => (
                      <div key={i} className="mb-2.5 last:mb-0">
                        <div className="font-bold text-zinc-950 text-sm sm:text-[14.5px]">
                          {st.name || 'Student Name'}
                        </div>
                        <div className="font-mono text-zinc-700 text-xs">
                          Student ID: {st.id || '011...'}
                        </div>
                        <div className="text-zinc-600 text-[11px] leading-tight">
                          {st.program || 'B.Sc. in CSE'}
                        </div>
                      </div>
                    ))}
                    <div className="text-zinc-500 text-[11px] mt-1.5">{UNIVERSITY_NAME}</div>
                  </div>

                  {/* Submitted To */}
                  <div>
                    <div
                      className="text-sm sm:text-base font-bold uppercase tracking-wider mb-2"
                      style={{ color: THEME_ORANGE }}
                    >
                      Submitted To:
                    </div>
                    <div className="font-bold text-zinc-950 text-sm sm:text-[14.5px]">
                      {facultyName || 'Faculty Name'}
                    </div>
                    <div className="text-zinc-700 text-xs">{facultyDesignation}</div>
                    <div className="text-zinc-600 text-[11px] leading-tight mt-0.5">{facultyDept}</div>
                    <div className="text-zinc-500 text-[11px] mt-1.5">{UNIVERSITY_NAME}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Template Variant 2: MODERN (Solid UIU Banner) */}
            {docType !== 'labindex' && template === 'modern' && (
              <div className="h-full flex flex-col justify-between -m-10 sm:-m-14">
                {/* Solid Orange Top Banner */}
                <div
                  className="py-6 px-8 text-center text-white font-extrabold tracking-wider text-base sm:text-lg uppercase"
                  style={{ backgroundColor: THEME_ORANGE }}
                >
                  United International University
                </div>

                <div className="p-8 sm:p-12 flex-1 flex flex-col justify-between">
                  <div className="text-center pt-2">
                    <img
                      src={UIU_LOGO_BASE64}
                      alt="UIU Logo"
                      className="mx-auto h-14 sm:h-16 object-contain"
                    />
                  </div>

                  {/* Center Card */}
                  <div className="my-auto text-center space-y-3 py-4">
                    <div
                      className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide inline-block border-b-2 pb-1"
                      style={{ color: THEME_ORANGE, borderColor: THEME_ORANGE }}
                    >
                      {activeDocConfig.defaultTitle.toUpperCase()}
                    </div>

                    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 max-w-md mx-auto space-y-1 text-xs sm:text-sm">
                      <div className="text-base font-bold text-zinc-900 leading-tight">
                        {courseTitle}
                      </div>
                      <div className="font-semibold text-zinc-700">
                        {courseCode} · Section {courseSection} · {trimester}
                      </div>
                      {topicTitle && (
                        <div className="text-zinc-600 italic text-xs pt-1">"{topicTitle}"</div>
                      )}
                      <div className="text-zinc-500 text-[11px] pt-1">
                        Date: {formattedSubmissionDate}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bordered Boxes */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div className="rounded-xl border border-zinc-200 p-3.5 bg-zinc-50">
                      <div className="font-bold text-orange-600 border-b border-orange-200 pb-1 mb-2 uppercase tracking-wider text-[11px]">
                        Submitted By
                      </div>
                      {students.map((st, i) => (
                        <div key={i} className="mb-1.5 last:mb-0">
                          <div className="font-bold text-zinc-900 text-xs">{st.name}</div>
                          <div className="text-[10.5px] font-mono text-zinc-600">ID: {st.id}</div>
                        </div>
                      ))}
                      <div className="text-[10px] text-zinc-500 mt-1">{students[0]?.program}</div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 p-3.5 bg-zinc-50">
                      <div className="font-bold text-orange-600 border-b border-orange-200 pb-1 mb-2 uppercase tracking-wider text-[11px]">
                        Submitted To
                      </div>
                      <div className="font-bold text-zinc-900 text-xs">{facultyName}</div>
                      <div className="text-[10.5px] text-zinc-700">{facultyDesignation}</div>
                      <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">{facultyDept}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Template Variant 3: PROFESSIONAL (Outer Frame) */}
            {docType !== 'labindex' && template === 'professional' && (
              <div
                className="h-full flex flex-col justify-between p-6 -m-6 sm:-m-10"
                style={{ border: `2px solid ${THEME_ORANGE}` }}
              >
                <div className="text-center border-b-2 pb-3" style={{ borderColor: THEME_ORANGE }}>
                  <img
                    src={UIU_LOGO_BASE64}
                    alt="UIU Logo"
                    className="mx-auto h-16 object-contain"
                  />
                </div>

                <div className="text-center my-auto py-6 space-y-3">
                  <div
                    className="text-2xl sm:text-3xl font-extrabold uppercase tracking-widest"
                    style={{ color: THEME_ORANGE }}
                  >
                    {activeDocConfig.defaultTitle.toUpperCase()}
                  </div>
                  <div className="text-lg font-bold text-zinc-900">{courseTitle}</div>
                  <div className="rounded-lg bg-orange-50/70 p-3 inline-block text-left text-xs space-y-1 border border-orange-200/80">
                    <div><b>Course Code:</b> {courseCode} (Section {courseSection})</div>
                    {docNumber && <div><b>No:</b> {docNumber}</div>}
                    {topicTitle && <div><b>Topic:</b> {topicTitle}</div>}
                    <div><b>Date:</b> {formattedSubmissionDate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-300 text-xs">
                  <div>
                    <div className="font-bold uppercase tracking-wider text-xs mb-1.5" style={{ color: THEME_ORANGE }}>
                      Submitted By
                    </div>
                    {students.map((st, i) => (
                      <div key={i} className="mb-1.5">
                        <div className="font-bold text-zinc-900">{st.name}</div>
                        <div className="font-mono text-zinc-600">ID: {st.id}</div>
                      </div>
                    ))}
                    <div className="text-[10.5px] text-zinc-500">{students[0]?.program}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold uppercase tracking-wider text-xs mb-1.5" style={{ color: THEME_ORANGE }}>
                      Submitted To
                    </div>
                    <div className="font-bold text-zinc-900">{facultyName}</div>
                    <div className="text-zinc-700">{facultyDesignation}</div>
                    <div className="text-[10.5px] text-zinc-500">{facultyDept}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Template Variant 4: ELEGANT (Double Frame) */}
            {docType !== 'labindex' && template === 'elegant' && (
              <div
                className="h-full flex flex-col justify-between p-6 -m-6 sm:-m-10"
                style={{ border: `3px double ${THEME_ORANGE}` }}
              >
                <div className="text-center pt-2">
                  <img
                    src={UIU_LOGO_BASE64}
                    alt="UIU Logo"
                    className="mx-auto h-16 object-contain"
                  />
                  <div className="w-16 h-1 mx-auto mt-2" style={{ backgroundColor: THEME_ORANGE }} />
                </div>

                <div className="text-center my-auto py-4 space-y-2">
                  <div className="text-2xl font-bold uppercase tracking-wider text-zinc-900">
                    {activeDocConfig.defaultTitle.toUpperCase()}
                  </div>
                  <div className="text-base font-bold" style={{ color: THEME_ORANGE }}>
                    {courseTitle}
                  </div>
                  <div className="text-xs text-zinc-600">
                    {courseCode} · Section {courseSection} · {trimester}
                  </div>
                  {topicTitle && (
                    <div className="text-xs italic font-serif text-zinc-800 max-w-sm mx-auto pt-1">
                      "{topicTitle}"
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-200 text-xs">
                  <div>
                    <div className="font-bold uppercase tracking-widest text-[11px] mb-2" style={{ color: THEME_ORANGE }}>
                      Submitted By:
                    </div>
                    {students.map((st, i) => (
                      <div key={i} className="mb-2">
                        <div className="font-bold text-zinc-900 text-xs">{st.name}</div>
                        <div className="font-mono text-zinc-600 text-[11px]">ID: {st.id}</div>
                      </div>
                    ))}
                    <div className="text-[10px] text-zinc-500">{students[0]?.program}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold uppercase tracking-widest text-[11px] mb-2" style={{ color: THEME_ORANGE }}>
                      Submitted To:
                    </div>
                    <div className="font-bold text-zinc-900 text-xs">{facultyName}</div>
                    <div className="text-zinc-700 text-[11px]">{facultyDesignation}</div>
                    <div className="text-[10px] text-zinc-500 leading-tight">{facultyDept}</div>
                    <div className="text-[10px] text-zinc-400 mt-1">Date: {formattedSubmissionDate}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Template Variant 5: LAB INDEX TABLE PAGE */}
            {docType === 'labindex' && (
              <div className="h-full flex flex-col justify-between text-xs">
                <div>
                  <div className="text-center pb-2">
                    <img
                      src={UIU_LOGO_BASE64}
                      alt="UIU Logo"
                      className="mx-auto h-14 object-contain"
                    />
                    <div className="text-sm font-bold uppercase tracking-wider text-orange-600 mt-1">
                      Lab Index & Performance Sheet
                    </div>
                  </div>

                  {/* Course & Student Header Grid */}
                  <table className="w-full text-xs border-collapse mb-3">
                    <tbody>
                      <tr>
                        <td className="w-1/2 align-top pr-2">
                          <div><b>Course:</b> {courseCode} · {courseTitle}</div>
                          <div><b>Section:</b> {courseSection} · <b>Trimester:</b> {trimester}</div>
                        </td>
                        <td className="w-1/2 align-top pl-2 text-right">
                          <div><b>Student:</b> {students[0]?.name} ({students[0]?.id})</div>
                          <div><b>Faculty:</b> {facultyName} ({facultyDesignation})</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Index Table */}
                  <table className="w-full text-[11px] border-collapse border border-zinc-400">
                    <thead>
                      <tr className="bg-orange-500 text-white font-bold text-center">
                        <th className="border border-zinc-400 py-1 px-1.5 w-10">SL</th>
                        <th className="border border-zinc-400 py-1 px-2 text-left">Experiment Name</th>
                        <th className="border border-zinc-400 py-1 px-2 w-24">Date</th>
                        <th className="border border-zinc-400 py-1 px-1.5 w-14">Page</th>
                        <th className="border border-zinc-400 py-1 px-2 w-24">Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 14 }).map((_, idx) => {
                        const r = indexRows[idx] || {};
                        return (
                          <tr key={idx} className="h-7 text-center">
                            <td className="border border-zinc-300 font-bold">{idx + 1}</td>
                            <td className="border border-zinc-300 text-left px-2 truncate max-w-[200px] font-medium">
                              {r.name || ''}
                            </td>
                            <td className="border border-zinc-300 text-zinc-600 font-mono text-[10px]">
                              {r.date || ''}
                            </td>
                            <td className="border border-zinc-300 font-mono text-[10px]">{r.page || ''}</td>
                            <td className="border border-zinc-300"></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="text-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-200">
                  {UNIVERSITY_NAME} · {facultyDept}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Print Stylesheet targeting exact A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          #cover-page-print-container, #cover-page-print-container * {
            visibility: visible;
          }
          #cover-page-print-container {
            position: fixed;
            left: 0;
            top: 0;
            width: 210mm !important;
            height: 297mm !important;
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 20mm !important;
            margin: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
