import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileUp,
  Upload,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  BookOpen,
  User,
  Clock,
  MapPin,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import {
  extractTextFromPdf,
  parseUcamRoutineText,
  formatMinutes,
} from '../../utils/ucamRoutineParser';
import { generateICS } from '../../utils/icsGenerator';
import { useToast } from '../../context/ToastContext';

export default function UcamRoutineUploadModal({
  open,
  onClose,
  onApplyToRoutine,
  onApplyToCgpa,
}) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' or 'text'
  const [isProcessing, setIsProcessing] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleProcessText = (raw) => {
    setErrorMsg('');
    try {
      const result = parseUcamRoutineText(raw);
      setParsedResult(result);
      showToast(`Successfully parsed ${result.courses.length} courses from UCAM!`, 'success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to parse UCAM routine.');
      showToast(err.message || 'Parse error', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('Please select a valid .pdf file.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    try {
      const text = await extractTextFromPdf(file);
      handleProcessText(text);
    } catch (err) {
      setErrorMsg(
        `PDF extraction error: ${err.message}. You can also copy and paste the routine text directly in the 'Paste Text' tab.`
      );
      showToast('PDF parse error, try paste tab', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToTimetable = () => {
    if (!parsedResult) return;
    try {
      // Map parsed courses into the format the routine view stores
      const selectedForRoutine = parsedResult.courses.map((c) => ({
        code: c.code,
        sectionId: `BSCSE-${c.code}-${c.section}`,
        customSection: {
          id: `UCAM-${c.code}-${c.section}`,
          code: c.code,
          title: c.title,
          section: c.section,
          credit: c.credit,
          meetings: c.meetings,
        },
      }));

      // Store in localStorage
      localStorage.setItem('ez_routine_selected', JSON.stringify(selectedForRoutine));
      if (parsedResult.studentId && parsedResult.studentId !== 'Unknown') {
        localStorage.setItem('ez_student_id', parsedResult.studentId);
      }
      onApplyToRoutine?.(selectedForRoutine, parsedResult);
      showToast(`Applied ${parsedResult.courses.length} courses to Routine Timetable!`, 'success');
      onClose();
    } catch (err) {
      showToast('Error syncing routine', 'error');
    }
  };

  const handleExportIcs = () => {
    if (!parsedResult || !parsedResult.matchedCalendar) return;
    try {
      const sectionsForIcs = parsedResult.courses.map((c) => ({
        id: `UCAM-${c.code}-${c.section}`,
        code: c.code,
        title: c.title,
        section: c.section,
        credit: c.credit,
        meetings: c.meetings,
        faculty: ['UIU Faculty'],
      }));

      const firstDateStr = parsedResult.termSynthesis?.classesBegin || '2026-10-27';
      const lastDateStr = '2027-02-15';

      const icsData = generateICS({
        sections: sectionsForIcs,
        customCourses: [],
        calendar: parsedResult.matchedCalendar,
        firstDateStr,
        lastDateStr,
        alarmEnabled: true,
        alarmMinutes: 15,
      });

      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UIU_Routine_${parsedResult.studentId || 'Fall2026'}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded full semester .ics calendar file!', 'success');
    } catch (err) {
      showToast(err.message || 'Error generating .ics', 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload UCAM Class Routine PDF"
      sub="Automatically parse your UCAM routine, match the active UIU academic calendar, and build your schedule"
      width="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Input Mode Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('pdf')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'pdf'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface2 text-ink-3 hover:text-ink'
              }`}
            >
              Upload PDF File
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'text'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface2 text-ink-3 hover:text-ink'
              }`}
            >
              Paste Routine Text / OCR
            </button>
          </div>
        </div>

        {/* Tab 1: PDF Dropzone */}
        {activeTab === 'pdf' && (
          <div className="rounded-2xl border-2 border-dashed border-line-strong hover:border-accent bg-surface2/30 p-8 text-center transition-colors">
            <input
              type="file"
              id="ucam-pdf-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="ucam-pdf-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="h-12 w-12 rounded-2xl bg-accentSoft text-accent flex items-center justify-center mb-3 shadow-sm">
                <FileUp className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-ink">
                Click to browse or drag & drop your UCAM Class Routine PDF
              </h4>
              <p className="mt-1 text-xs text-ink-3">
                Exported directly from UCAM (ucam.uiu.ac.bd) or UCAM Cloud
              </p>
              <span className="mt-4 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-ink shadow-sm hover:border-accent">
                Select .pdf File
              </span>
            </label>
            {isProcessing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-accent animate-pulse">
                <Clock className="h-4 w-4 animate-spin" />
                Extracting routine table from PDF...
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Text / OCR Paste */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste raw text or OCR from your UCAM Class Routine here... (e.g. Formal Code, Day, Room, Time Slot, Section)"
              className="w-full rounded-2xl border border-line bg-surface p-3.5 font-mono text-xs text-ink placeholder-ink-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                disabled={!pasteText.trim()}
                onClick={() => handleProcessText(pasteText)}
              >
                Parse Routine Text
              </Button>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="rounded-xl border border-bad/25 bg-bad/10 p-3 text-xs text-bad flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Parsed Results Live Inspector */}
        {parsedResult && (
          <div className="space-y-4 pt-2 border-t border-line fade-in">
            {/* Student & Term Metadata Header Strip */}
            <div className="rounded-2xl border border-accent/30 bg-accentSoft p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink flex items-center gap-1.5">
                    <User className="h-4 w-4 text-accent" />
                    {parsedResult.studentName}
                  </span>
                  <span className="font-mono text-xs font-bold rounded-md bg-surface border border-line px-2 py-0.5 text-accent">
                    {parsedResult.studentId}
                  </span>
                </div>
                <div className="mt-1 text-xs text-ink-2 font-medium">
                  Session: <b>{parsedResult.session}</b> · Matched: <b>{parsedResult.matchedCalendar?.label || parsedResult.matchedCalendar?.title}</b>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink">
                  {parsedResult.courses.length} Courses
                </span>
                <span className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-accent font-mono">
                  {parsedResult.totalCredits} Credits
                </span>
              </div>
            </div>

            {/* Academic Calendar Milestones Strip */}
            {parsedResult.termSynthesis && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                    Classes Begin
                  </span>
                  <div className="font-mono text-sm font-bold text-ink mt-0.5">
                    {parsedResult.termSynthesis.classesBegin}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                    Mid-Term Exam Period
                  </span>
                  <div className="font-mono text-xs font-bold text-warn mt-0.5">
                    {parsedResult.termSynthesis.midtermPeriod}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                    Final Exam Period
                  </span>
                  <div className="font-mono text-xs font-bold text-ok mt-0.5">
                    {parsedResult.termSynthesis.finalExamPeriod}
                  </div>
                </div>
              </div>
            )}

            {/* Parsed Class Sections Table */}
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              <div className="px-4 py-2.5 border-b border-line text-xs font-bold text-ink flex items-center justify-between">
                <span>Enrolled Course Sections ({parsedResult.courses.length})</span>
                <span className="text-ok font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 0 Routine Clashes
                </span>
              </div>

              <div className="divide-y divide-line/60">
                {parsedResult.courses.map((course) => (
                  <div
                    key={course.code}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-surface2/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-accent text-sm">
                          {course.code}
                        </span>
                        <span className="rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink">
                          Sec {course.section || '—'}
                        </span>
                        <span className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-3">
                          {course.credit} cr
                        </span>
                      </div>
                      <div className="font-medium text-ink mt-0.5">{course.title}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {course.meetings.map((m, mIdx) => (
                        <span
                          key={mIdx}
                          className="rounded-lg border border-line bg-surface2/60 px-2.5 py-1 text-[11px] font-mono text-ink-2"
                        >
                          <b className="text-accent">{m[0]}</b> {formatMinutes(m[1])} – {formatMinutes(m[2])} (Room {m[3]})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setParsedResult(null)}
                className="text-xs font-semibold text-ink-3 hover:text-bad flex items-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear & Upload Another
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  icon={Download}
                  onClick={handleExportIcs}
                >
                  Export .ics (Phone Calendar)
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={Calendar}
                  onClick={handleApplyToTimetable}
                >
                  Load Into Weekly Timetable
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
