import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import Select from '../ui/Select';
import { useToast } from '../../context/ToastContext';
import { COURSE_CATALOG } from '../../data/courseCatalog';

const STORAGE_COVERPAGE_KEY = 'ez_uiu_coverpage_v2';

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
  'Assignment',
  'Lab Report',
  'Project Report',
  'Term Paper',
  'Presentation Report',
  'Case Study',
];

export function UiuCrestSvg({ className = 'h-20 w-20' }) {
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="80" r="76" stroke="#f97316" strokeWidth="3" strokeDasharray="6 3" />
      <circle cx="80" cy="80" r="70" fill="#fff" stroke="#1e3a8a" strokeWidth="2.5" />
      {/* Sunburst Rays */}
      <path d="M80 22L83 34H77L80 22Z" fill="#f97316" />
      <path d="M120 38L112 47L108 42L120 38Z" fill="#f97316" />
      <path d="M138 80L126 83V77L138 80Z" fill="#f97316" />
      <path d="M40 38L52 42L48 47L40 38Z" fill="#f97316" />
      <path d="M22 80L34 77V83L22 80Z" fill="#f97316" />
      {/* Shield Base */}
      <path d="M48 54H112V88C112 108 80 124 80 124C80 124 48 108 48 88V54Z" fill="#1e3a8a" />
      {/* Book & Gear */}
      <path d="M56 64H104V86C104 98 80 112 80 112C80 112 56 98 56 86V64Z" fill="#fff" />
      <path d="M80 70V104M62 76C70 73 78 75 80 77C82 75 90 73 98 76M62 86C70 83 78 85 80 87C82 85 90 83 98 86" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
      {/* Ribbon */}
      <path d="M34 128C50 122 110 122 126 128L120 138C104 132 56 132 40 138L34 128Z" fill="#f97316" />
      <text x="80" y="135" textAnchor="middle" fill="#fff" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">
        EXCELLENCE IN EDUCATION
      </text>
    </svg>
  );
}

export default function CoverPageView() {
  const { showToast } = useToast();
  const printAreaRef = useRef(null);

  const [docType, setDocType] = useState('Assignment');
  const [docNumber, setDocNumber] = useState('01');
  const [assignmentTitle, setAssignmentTitle] = useState('Implementation and Comparative Analysis');
  const [submissionDate, setSubmissionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [performanceDate, setPerformanceDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [courseCode, setCourseCode] = useState('CSE 4451');
  const [courseTitle, setCourseTitle] = useState('Human Computer Interaction');
  const [courseSection, setCourseSection] = useState('C');
  const [trimester, setTrimester] = useState('Fall 2026');

  const [facultyName, setFacultyName] = useState('Dr. Mohammad Nurul Huda');
  const [facultyDesignation, setFacultyDesignation] = useState('Professor');
  const [facultyDept, setFacultyDept] = useState('Department of Computer Science and Engineering');

  const [template, setTemplate] = useState('formal'); // 'formal' | 'modern' | 'lab' | 'minimal'
  const [isGroup, setIsGroup] = useState(false);

  const [students, setStudents] = useState([
    { name: 'Md. Junaed Khandakar', id: '0112330072', section: 'C', program: 'B.Sc. in CSE' },
  ]);

  // Load saved profile data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COVERPAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.docType) setDocType(d.docType);
        if (d.docNumber) setDocNumber(d.docNumber);
        if (d.assignmentTitle) setAssignmentTitle(d.assignmentTitle);
        if (d.courseCode) setCourseCode(d.courseCode);
        if (d.courseTitle) setCourseTitle(d.courseTitle);
        if (d.courseSection) setCourseSection(d.courseSection);
        if (d.trimester) setTrimester(d.trimester);
        if (d.facultyName) setFacultyName(d.facultyName);
        if (d.facultyDesignation) setFacultyDesignation(d.facultyDesignation);
        if (d.facultyDept) setFacultyDept(d.facultyDept);
        if (d.template) setTemplate(d.template);
        if (d.isGroup !== undefined) setIsGroup(d.isGroup);
        if (d.students?.length) setStudents(d.students);
      }
    } catch {}
  }, []);

  // Auto-save on every change
  useEffect(() => {
    try {
      const payload = {
        docType,
        docNumber,
        assignmentTitle,
        courseCode,
        courseTitle,
        courseSection,
        trimester,
        facultyName,
        facultyDesignation,
        facultyDept,
        template,
        isGroup,
        students,
      };
      localStorage.setItem(STORAGE_COVERPAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [
    docType,
    docNumber,
    assignmentTitle,
    courseCode,
    courseTitle,
    courseSection,
    trimester,
    facultyName,
    facultyDesignation,
    facultyDept,
    template,
    isGroup,
    students,
  ]);

  const handleAddStudent = () => {
    if (students.length >= 6) {
      showToast('Maximum 6 group members allowed', 'info');
      return;
    }
    setStudents([...students, { name: '', id: '', section: courseSection, program: 'B.Sc. in CSE' }]);
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

  const handleSelectCatalogCourse = (code) => {
    const c = COURSE_CATALOG.find((item) => item.course_code === code);
    if (c) {
      setCourseCode(c.course_code);
      setCourseTitle(c.course_name);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadDoc = () => {
    if (!printAreaRef.current) return;
    try {
      const content = printAreaRef.current.innerHTML;
      const html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${courseCode} ${docType} ${docNumber} Cover Page</title>
          <style>
            @page { size: A4; margin: 1in; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 11pt; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UIU_CoverPage_${courseCode.replace(/\s+/g, '_')}_${docType}_${docNumber}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported editable Word document!', 'success');
    } catch {
      showToast('Error exporting Word file', 'error');
    }
  };

  const templates = [
    { id: 'formal', name: 'Official UIU Formal', desc: 'Faculty approved boxed layout with official double border' },
    { id: 'modern', name: 'Modern Minimalist', desc: 'Linear & Swiss typography with clean left accent band' },
    { id: 'lab', name: 'Engineering Lab Report', desc: 'Detailed table layout with experiment dates & signatures' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-accent" />
            UIU Assignment & Lab Cover Page Generator
          </h1>
          <p className="mt-0.5 text-xs text-ink-3">
            Real-time A4 vector preview, official UIU emblem, auto-saved locally, prints directly to sharp PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={Download} onClick={handleDownloadDoc}>
            Export Word (.doc)
          </Button>
          <Button variant="primary" icon={Printer} onClick={handlePrintPdf}>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ================= LEFT CONTROLS ================= */}
        <div className="flex flex-col gap-4 lg:col-span-5 no-print">
          {/* Template & Document Type */}
          <Surface className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-ink">Design Template</h3>
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

            <div className="grid grid-cols-3 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                    template === t.id
                      ? 'border-accent bg-accentSoft text-accent font-bold shadow-sm ring-2 ring-accent/20'
                      : 'border-line bg-surface2/50 text-ink-3 hover:text-ink hover:bg-surface2'
                  }`}
                >
                  <span className="text-xs">{t.name.split(' ')[1] || t.name}</span>
                  <span className="text-[9px] opacity-75 mt-0.5">{t.id}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  Document Type
                </label>
                <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {DOC_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  {docType === 'Lab Report' ? 'Experiment No.' : 'Assignment No.'}
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. 01, Final"
                  className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-mono font-bold text-ink outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Topic / Experiment Title
              </label>
              <input
                type="text"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                placeholder="e.g. Analysis of CPU Scheduling Algorithms"
                className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-medium text-ink outline-none focus:border-accent"
              />
            </div>
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
                  className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-mono font-bold text-ink outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={courseSection}
                  onChange={(e) => setCourseSection(e.target.value)}
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
                className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-medium text-ink outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
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

            <div className="space-y-3">
              {students.map((student, idx) => (
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
                      value={student.name}
                      onChange={(e) => handleStudentChange(idx, 'name', e.target.value)}
                      placeholder="Student Full Name"
                      className="h-8 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      value={student.id}
                      onChange={(e) => handleStudentChange(idx, 'id', e.target.value)}
                      placeholder="Student ID (011...)"
                      className="h-8 rounded-lg border border-line bg-surface px-2.5 font-mono text-xs text-ink outline-none focus:border-accent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>

        {/* ================= RIGHT LIVE A4 PRINT PREVIEW ================= */}
        <div className="flex flex-col items-center lg:col-span-7">
          <div className="w-full flex items-center justify-between px-2 pb-2 text-xs text-ink-3 no-print">
            <span className="font-semibold flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-accent" />
              Live A4 True-to-Scale Vector Preview
            </span>
            <span>Standard 210 × 297 mm</span>
          </div>

          {/* Printable A4 Container */}
          <div
            id="cover-page-print-container"
            ref={printAreaRef}
            className="w-full max-w-[580px] aspect-[1/1.4142] bg-white text-zinc-900 rounded-xl shadow-2xl p-8 sm:p-12 flex flex-col justify-between border border-zinc-200 overflow-hidden select-text"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              color: '#0f172a',
            }}
          >
            {/* Top Institutional Header */}
            <div className="text-center space-y-1.5">
              <div className="flex justify-center mb-1">
                <UiuCrestSvg className="h-16 w-16" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-blue-950 font-serif">
                United International University
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-600 font-sans tracking-wide">
                {facultyDept}
              </p>
            </div>

            {/* Document Title Section */}
            <div className="text-center my-auto py-4 space-y-3">
              <div className="inline-block border-y-2 border-zinc-800 py-1 px-6">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] font-sans">
                  {docType} {docNumber ? `#${docNumber}` : ''}
                </span>
              </div>

              <div>
                <span className="block text-[11px] uppercase tracking-wider text-zinc-500 font-sans">
                  Course Code & Title:
                </span>
                <div className="text-sm sm:text-base font-bold text-blue-950 font-sans">
                  {courseCode} · {courseTitle}
                </div>
                <div className="text-xs text-zinc-600 font-sans mt-0.5">
                  Section: <b>{courseSection || 'N/A'}</b> · Trimester: <b>{trimester}</b>
                </div>
              </div>

              {assignmentTitle && (
                <div className="pt-2">
                  <span className="block text-[10.5px] uppercase tracking-wider text-zinc-500 font-sans">
                    Title / Topic:
                  </span>
                  <p className="text-xs sm:text-sm font-semibold italic text-zinc-800 max-w-md mx-auto">
                    "{assignmentTitle}"
                  </p>
                </div>
              )}
            </div>

            {/* Submitted To & Submitted By Grid */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-zinc-800 text-xs font-sans">
              {/* Submitted To */}
              <div>
                <span className="block text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Submitted To:
                </span>
                <div className="font-bold text-sm text-zinc-900">{facultyName || 'Faculty Name'}</div>
                <div className="text-[11px] text-zinc-700">{facultyDesignation}</div>
                <div className="text-[10px] text-zinc-600 leading-tight mt-0.5">{facultyDept}</div>
                <div className="text-[10px] text-zinc-500 mt-1">United International University</div>
              </div>

              {/* Submitted By */}
              <div>
                <span className="block text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Submitted By:
                </span>
                {students.map((st, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <div className="font-bold text-sm text-zinc-900">{st.name || 'Student Name'}</div>
                    <div className="font-mono text-[11px] text-zinc-700">ID: {st.id || 'Student ID'}</div>
                    <div className="text-[10px] text-zinc-600">{st.program || 'B.Sc. in CSE'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Date Footer */}
            <div className="text-center pt-4 border-t border-zinc-200 text-[11px] font-sans text-zinc-600 flex justify-between items-center">
              <span>United City, Madani Avenue, Badda, Dhaka</span>
              <span>
                Submission Date:{' '}
                <b>
                  {new Date(submissionDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </b>
              </span>
            </div>
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
            width: 100vw;
            height: 100vh;
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 2.5cm 2cm !important;
            margin: 0 !important;
            border-radius: 0 !important;
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
