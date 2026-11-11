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
  FolderKanban,
  FlaskConical,
  X,
  FileUp,
  FileDown,
} from 'lucide-react';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import Select from '../ui/Select';
import { useToast } from '../../context/ToastContext';
import { COURSE_CATALOG } from '../../data/courseCatalog';
import { UIU_LOGO_BASE64 } from '../../data/uiuLogoBase64';
import { getSavedRoutine } from '../../utils/routineStore';
import {
  generateCoverPagePdf,
  mergeCoverPageWithPdf,
  downloadPdfBlob,
  getAssignmentPageCount,
} from '../../utils/coverPagePdf';

const STORAGE_COVERPAGE_KEY = 'ez_uiu_coverpage_v3';
const THEME_ORANGE = '#f97316';
const UNIVERSITY_NAME = 'United International University';

/**
 * Returns today's current date formatted as YYYY-MM-DD in the user's browser timezone
 */
export function getBrowserLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  { id: 'assignment', label: 'Assignment', icon: FileText, defaultTitle: 'Assignment' },
  { id: 'project', label: 'Project Report', icon: FolderKanban, defaultTitle: 'Project Report' },
  { id: 'lab', label: 'Lab Report', icon: FlaskConical, defaultTitle: 'Lab Report' },
];

export default function CoverPageView() {
  const { showToast } = useToast();
  const printAreaRef = useRef(null);

  const routine = useMemo(() => getSavedRoutine(), []);

  const [docType, setDocType] = useState('assignment');
  const [template, setTemplate] = useState('classic'); // 'classic' | 'modern' | 'professional' | 'elegant'
  const [isGroup, setIsGroup] = useState(false);

  // Form Fields
  const [docNumber, setDocNumber] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [submissionDate, setSubmissionDate] = useState(() => getBrowserLocalDate());
  const [performanceDate, setPerformanceDate] = useState(() => getBrowserLocalDate());

  const [courseCode, setCourseCode] = useState(() => routine[0]?.code || '');
  const [courseTitle, setCourseTitle] = useState(() => routine[0]?.title || '');
  const [courseSection, setCourseSection] = useState(() => routine[0]?.section || '');
  const [trimester, setTrimester] = useState('Fall 2026');
  const [isEditingCourse, setIsEditingCourse] = useState(false);

  const [facultyName, setFacultyName] = useState('');
  const [facultyDesignation, setFacultyDesignation] = useState('Professor');
  const [facultyDept, setFacultyDept] = useState('Department of Computer Science and Engineering');

  const [students, setStudents] = useState(() => {
    const savedId = (localStorage.getItem('ez_student_id') || '').trim();
    return [
      {
        name: '',
        id: savedId || '',
        section: routine[0]?.section || '',
        program: 'B.Sc. in Computer Science and Engineering',
      },
    ];
  });

  // Assignment PDF Merge State
  const [assignmentFile, setAssignmentFile] = useState(null); // { name, size, bytes, pageCount }
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const fileInputRef = useRef(null);

  // Load saved progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COVERPAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.docType && DOC_TYPES.some((t) => t.id === d.docType)) setDocType(d.docType);
        if (d.template) setTemplate(d.template);
        if (d.docNumber && d.docNumber !== '01') setDocNumber(d.docNumber);
        if (d.topicTitle && d.topicTitle !== 'Heuristic Evaluation of User Interfaces') {
          setTopicTitle(d.topicTitle);
        }
        if (d.submissionDate && d.submissionDate >= getBrowserLocalDate()) {
          setSubmissionDate(d.submissionDate);
        }
        if (d.courseCode && d.courseCode !== 'CSE 4451') setCourseCode(d.courseCode);
        if (d.courseTitle && d.courseTitle !== 'Human Computer Interaction') setCourseTitle(d.courseTitle);
        if (d.courseSection && d.courseSection !== 'C') setCourseSection(d.courseSection);
        if (d.trimester) setTrimester(d.trimester);
        if (d.facultyName && d.facultyName !== 'Dr. Mohammad Nurul Huda') setFacultyName(d.facultyName);
        if (d.facultyDesignation) setFacultyDesignation(d.facultyDesignation);
        if (d.facultyDept) setFacultyDept(d.facultyDept);
        if (d.isGroup !== undefined) setIsGroup(d.isGroup);
        if (d.students?.length) {
          const cleaned = d.students.map((st) => ({
            ...st,
            name: st.name === 'Md. Junaed Khandakar' ? '' : st.name,
            id: st.id === '0112330072' ? '' : st.id,
          }));
          setStudents(cleaned);
        }
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

  const handleSelectCatalogCourse = (code) => {
    // 1. Check saved routine first (includes section & custom metadata)
    const routineMatch = routine.find((item) => item.code === code);
    if (routineMatch) {
      setCourseCode(routineMatch.code);
      setCourseTitle(routineMatch.title);
      if (routineMatch.section) setCourseSection(routineMatch.section);
      showToast(`Selected ${routineMatch.code} (Sec ${routineMatch.section})`, 'info');
      return;
    }

    // 2. Fallback to general catalog
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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Please select a valid PDF file', 'error');
      return;
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pageCount = await getAssignmentPageCount(arrayBuffer);
      setAssignmentFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        bytes: arrayBuffer,
        pageCount,
      });
      showToast(`Loaded "${file.name}" (${pageCount} pages)`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not read PDF. Ensure it is not encrypted.', 'error');
    }
  };

  const handleDownloadCoverPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      showToast('Generating vector A4 Cover Page PDF...', 'info');
      const doc = await generateCoverPagePdf({
        template,
        docType,
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
        students,
      });
      const bytes = await doc.save();
      const filename = `UIU_${activeDocConfig.label.replace(/\s+/g, '_')}_${courseCode.replace(/\s+/g, '_')}_Cover.pdf`;
      downloadPdfBlob(bytes, filename);
      showToast('Cover Page PDF downloaded!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generating PDF: ' + (err.message || 'unknown'), 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleMergeDownload = async () => {
    if (!assignmentFile?.bytes) {
      fileInputRef.current?.click();
      return;
    }
    setIsMerging(true);
    try {
      showToast('Merging Cover Page as Page 1 with your assignment...', 'info');
      const coverDoc = await generateCoverPagePdf({
        template,
        docType,
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
        students,
      });
      const { mergedPdfBytes, pageCount } = await mergeCoverPageWithPdf(
        coverDoc,
        assignmentFile.bytes
      );
      const filename = `UIU_${activeDocConfig.label.replace(/\s+/g, '_')}_${courseCode.replace(/\s+/g, '_')}_Merged.pdf`;
      downloadPdfBlob(mergedPdfBytes, filename);
      showToast(
        `Merged & downloaded ${pageCount} pages (Cover + ${assignmentFile.pageCount} assignment pages)!`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Error merging PDFs: ' + (err.message || 'Check PDF file'), 'error');
    } finally {
      setIsMerging(false);
    }
  };

  const formattedSubmissionDate = useMemo(() => {
    if (!submissionDate) return '';
    try {
      const parts = String(submissionDate).split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
      return submissionDate;
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
          <Button
            variant="primary"
            icon={FileDown}
            onClick={handleDownloadCoverPdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? 'Generating...' : 'Download Cover PDF'}
          </Button>
          {assignmentFile && (
            <Button
              variant="primary"
              icon={Layers}
              onClick={handleMergeDownload}
              disabled={isMerging}
              className="bg-ok hover:bg-ok/90 border-ok text-white font-bold"
            >
              {isMerging ? 'Merging...' : `Merge & Download (${assignmentFile.pageCount + 1}p)`}
            </Button>
          )}
          <Button variant="secondary" icon={Download} onClick={handleDownloadDoc}>
            Word (.doc)
          </Button>
          <Button variant="secondary" icon={Printer} onClick={handlePrint}>
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ================= LEFT CONTROLS ================= */}
        <div className="flex flex-col gap-4 lg:col-span-5 no-print">
          {/* Assignment PDF Merger Card */}
          <Surface className="space-y-3 border-accent/35 bg-accentSoft/20">
            <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-bold text-ink">Merge with Assignment PDF</h3>
              </div>
              <span className="rounded bg-accentSoft px-1.5 py-0.5 text-[9.5px] font-bold text-accent border border-accent/25 uppercase tracking-wider">
                Cover = Page 1
              </span>
            </div>

            {!assignmentFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelect({ target: { files: [file] } });
                }}
                className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-accent/40 bg-surface2/40 p-4 text-center cursor-pointer transition-all hover:border-accent hover:bg-surface2/70"
              >
                <div className="rounded-xl bg-accentSoft p-2 text-accent group-hover:scale-105 transition-transform">
                  <FileUp className="h-5 w-5" />
                </div>
                <p className="mt-2 text-xs font-bold text-ink">
                  Drop your assignment PDF here, or <span className="text-accent underline">browse</span>
                </p>
                <p className="mt-0.5 text-[10.5px] text-ink-3">
                  Upload your report — this cover page will be attached as Page 1
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-2.5 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="rounded-lg bg-accentSoft p-2 text-accent">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink">{assignmentFile.name}</p>
                      <p className="text-[10px] text-ink-3">
                        {assignmentFile.pageCount} pages · {assignmentFile.size}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignmentFile(null)}
                    className="rounded-lg p-1 text-ink-3 hover:bg-bad/10 hover:text-bad transition-colors"
                    title="Remove PDF"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Button
                  variant="primary"
                  icon={Layers}
                  onClick={handleMergeDownload}
                  disabled={isMerging}
                  className="w-full justify-center shadow-md font-bold"
                >
                  {isMerging
                    ? 'Merging Cover & Assignment...'
                    : `Merge & Download PDF (${assignmentFile.pageCount + 1} Pages)`}
                </Button>
                <p className="text-center text-[10px] text-ink-3">
                  Cover Page will be prepended as Page 1 of your {assignmentFile.pageCount}-page document
                </p>
              </div>
            )}
          </Surface>

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

            <div className="grid grid-cols-3 gap-1.5">
              {DOC_TYPES.map((dt) => {
                const Icon = dt.icon;
                return (
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
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{dt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Template Selector */}
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
          </Surface>

          {/* Course Details (Inputted from User's Routine) */}
          <Surface className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-ink">Course</h3>
                {routine.length > 0 && (
                  <p className="text-[10.5px] text-ink-3">
                    Select a course from your routine ({routine.length} available)
                  </p>
                )}
              </div>
              {routine.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsEditingCourse((prev) => !prev)}
                  className="text-[11px] font-semibold text-accent hover:underline"
                >
                  {isEditingCourse ? 'Done' : 'Manual / Edit'}
                </button>
              )}
            </div>

            {/* If user has routine, show direct selectable course cards */}
            {routine.length > 0 ? (
              <div className="space-y-1.5">
                {routine.map((c) => {
                  const isSelected = courseCode === c.code && courseSection === c.section;
                  return (
                    <button
                      key={`${c.code}-${c.section}`}
                      type="button"
                      onClick={() => {
                        setCourseCode(c.code);
                        setCourseTitle(c.title);
                        setCourseSection(c.section);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-accent bg-accentSoft/60 text-ink shadow-sm ring-1 ring-accent/30'
                          : 'border-line bg-surface hover:bg-surface2/60 text-ink-2 hover:text-ink'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-accent">{c.code}</span>
                          <span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px] font-semibold text-ink-3">
                            Sec {c.section}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-ink truncate mt-0.5">{c.title}</div>
                      </div>
                      {isSelected && (
                        <div className="rounded-full bg-accent text-white p-0.5 shrink-0 ml-2">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Manual Fields: visible if toggled or if no routine is saved */}
            {(isEditingCourse || routine.length === 0) && (
              <div className={`space-y-2.5 ${routine.length > 0 ? 'pt-2 border-t border-line' : ''}`}>
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
                      Course Section
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
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  {docType === 'lab' ? 'Experiment No.' : 'Assignment / Report No.'}
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
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
                className="h-[38px] w-full rounded-xl border border-line bg-surface2/60 px-3 text-xs font-medium text-ink outline-none focus:border-accent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10.5px] font-semibold text-ink-3 uppercase tracking-wider">
                  Submission Date
                </label>
                {submissionDate !== getBrowserLocalDate() && (
                  <button
                    type="button"
                    onClick={() => setSubmissionDate(getBrowserLocalDate())}
                    className="text-[10px] font-semibold text-accent hover:underline"
                  >
                    Set to Today
                  </button>
                )}
              </div>
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
                    <div>
                      <label className="block text-[9.5px] font-semibold text-ink-3 uppercase mb-0.5">
                        Name
                      </label>
                      <input
                        type="text"
                        value={st.name}
                        onChange={(e) => handleStudentChange(idx, 'name', e.target.value)}
                        className="h-8 w-full rounded-lg border border-line bg-surface px-2.5 text-xs text-ink outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-semibold text-ink-3 uppercase mb-0.5">
                        Student ID
                      </label>
                      <input
                        type="text"
                        value={st.id}
                        onChange={(e) => handleStudentChange(idx, 'id', e.target.value)}
                        className="h-8 w-full rounded-lg border border-line bg-surface px-2.5 font-mono text-xs text-ink outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
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
            {template === 'classic' && (
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
                    {courseTitle || courseCode || ''}
                  </div>

                  <div className="inline-block text-left text-xs sm:text-sm font-semibold space-y-1.5 text-zinc-800 pt-2">
                    {courseCode && (
                      <div>
                        <span className="text-zinc-500">Course Code:</span> {courseCode}
                      </div>
                    )}
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
                    {topicTitle?.trim() && (
                      <div className="max-w-md">
                        <span className="text-zinc-500">Topic:</span> {topicTitle.trim()}
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
                    {students.some((st) => st.name || st.id) ? (
                      students.map((st, i) => (
                        <div key={i} className="mb-2.5 last:mb-0">
                          {st.name && (
                            <div className="font-bold text-zinc-950 text-sm sm:text-[14.5px]">
                              {st.name}
                            </div>
                          )}
                          {st.id && (
                            <div className="font-mono text-zinc-700 text-xs">
                              Student ID: {st.id}
                            </div>
                          )}
                          <div className="text-zinc-600 text-[11px] leading-tight">
                            {st.program || 'B.Sc. in CSE'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-400 text-xs italic">Student details not entered</div>
                    )}
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
                    {facultyName ? (
                      <>
                        <div className="font-bold text-zinc-950 text-sm sm:text-[14.5px]">
                          {facultyName}
                        </div>
                        <div className="text-zinc-700 text-xs">{facultyDesignation}</div>
                        <div className="text-zinc-600 text-[11px] leading-tight mt-0.5">{facultyDept}</div>
                      </>
                    ) : (
                      <div className="text-zinc-400 text-xs italic">Faculty name not entered</div>
                    )}
                    <div className="text-zinc-500 text-[11px] mt-1.5">{UNIVERSITY_NAME}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Template Variant 2: MODERN (Solid UIU Banner) */}
            {template === 'modern' && (
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
                      {courseTitle && (
                        <div className="text-base font-bold text-zinc-900 leading-tight">
                          {courseTitle}
                        </div>
                      )}
                      {(courseCode || courseSection) && (
                        <div className="font-semibold text-zinc-700">
                          {[courseCode, courseSection ? `Section ${courseSection}` : '', trimester]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      )}
                      {topicTitle?.trim() ? (
                        <div className="text-zinc-600 italic text-xs pt-1">"{topicTitle.trim()}"</div>
                      ) : null}
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
                      {students.some((st) => st.name || st.id) ? (
                        students.map((st, i) => (
                          <div key={i} className="mb-1.5 last:mb-0">
                            {st.name && <div className="font-bold text-zinc-900 text-xs">{st.name}</div>}
                            {st.id && <div className="text-[10.5px] font-mono text-zinc-600">ID: {st.id}</div>}
                          </div>
                        ))
                      ) : (
                        <div className="text-zinc-400 text-xs italic">Student details not entered</div>
                      )}
                      <div className="text-[10px] text-zinc-500 mt-1">{students[0]?.program}</div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 p-3.5 bg-zinc-50">
                      <div className="font-bold text-orange-600 border-b border-orange-200 pb-1 mb-2 uppercase tracking-wider text-[11px]">
                        Submitted To
                      </div>
                      {facultyName ? (
                        <>
                          <div className="font-bold text-zinc-900 text-xs">{facultyName}</div>
                          <div className="text-[10.5px] text-zinc-700">{facultyDesignation}</div>
                          <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">{facultyDept}</div>
                        </>
                      ) : (
                        <div className="text-zinc-400 text-xs italic">Faculty name not entered</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Template Variant 3: PROFESSIONAL (Outer Frame) */}
            {template === 'professional' && (
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
                  <div className="text-lg font-bold text-zinc-900">{courseTitle || courseCode || ''}</div>
                  <div className="rounded-lg bg-orange-50/70 p-3 inline-block text-left text-xs space-y-1 border border-orange-200/80">
                    {courseCode && <div><b>Course Code:</b> {courseCode}{courseSection ? ` (Section ${courseSection})` : ''}</div>}
                    {docNumber && <div><b>No:</b> {docNumber}</div>}
                    {topicTitle?.trim() && <div><b>Topic:</b> {topicTitle.trim()}</div>}
                    <div><b>Date:</b> {formattedSubmissionDate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-300 text-xs">
                  <div>
                    <div className="font-bold uppercase tracking-wider text-xs mb-1.5" style={{ color: THEME_ORANGE }}>
                      Submitted By
                    </div>
                    {students.some((st) => st.name || st.id) ? (
                      students.map((st, i) => (
                        <div key={i} className="mb-1.5">
                          {st.name && <div className="font-bold text-zinc-900">{st.name}</div>}
                          {st.id && <div className="font-mono text-zinc-600">ID: {st.id}</div>}
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-400 text-xs italic">Student details not entered</div>
                    )}
                    <div className="text-[10.5px] text-zinc-500">{students[0]?.program}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold uppercase tracking-wider text-xs mb-1.5" style={{ color: THEME_ORANGE }}>
                      Submitted To
                    </div>
                    {facultyName ? (
                      <>
                        <div className="font-bold text-zinc-900">{facultyName}</div>
                        <div className="text-zinc-700">{facultyDesignation}</div>
                        <div className="text-[10.5px] text-zinc-500">{facultyDept}</div>
                      </>
                    ) : (
                      <div className="text-zinc-400 text-xs italic">Faculty name not entered</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Template Variant 4: ELEGANT (Double Frame) */}
            {template === 'elegant' && (
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
                    {courseTitle || courseCode || ''}
                  </div>
                  {(courseCode || courseSection) && (
                    <div className="text-xs text-zinc-600">
                      {[courseCode, courseSection ? `Section ${courseSection}` : '', trimester]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                  {topicTitle?.trim() && (
                    <div className="text-xs italic font-serif text-zinc-800 max-w-sm mx-auto pt-1">
                      "{topicTitle.trim()}"
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-200 text-xs">
                  <div>
                    <div className="font-bold uppercase tracking-widest text-[11px] mb-2" style={{ color: THEME_ORANGE }}>
                      Submitted By:
                    </div>
                    {students.some((st) => st.name || st.id) ? (
                      students.map((st, i) => (
                        <div key={i} className="mb-2">
                          {st.name && <div className="font-bold text-zinc-900 text-xs">{st.name}</div>}
                          {st.id && <div className="font-mono text-zinc-600 text-[11px]">ID: {st.id}</div>}
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-400 text-xs italic">Student details not entered</div>
                    )}
                    <div className="text-[10px] text-zinc-500">{students[0]?.program}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold uppercase tracking-widest text-[11px] mb-2" style={{ color: THEME_ORANGE }}>
                      Submitted To:
                    </div>
                    {facultyName ? (
                      <>
                        <div className="font-bold text-zinc-900 text-xs">{facultyName}</div>
                        <div className="text-zinc-700 text-[11px]">{facultyDesignation}</div>
                        <div className="text-[10px] text-zinc-500 leading-tight">{facultyDept}</div>
                      </>
                    ) : (
                      <div className="text-zinc-400 text-xs italic">Faculty name not entered</div>
                    )}
                    <div className="text-[10px] text-zinc-400 mt-1">Date: {formattedSubmissionDate}</div>
                  </div>
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
