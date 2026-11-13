import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Download, AlertTriangle, FileUp, X } from 'lucide-react';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import Select from '../ui/Select';
import Empty from '../ui/Empty';
import Timetable from './Timetable';
import UcamRoutineUploadModal from './UcamRoutineUploadModal';
import FydpNotice from '../fydp/FydpNotice';
import { useToast } from '../../context/ToastContext';
import { CALENDARS_DATA, CALENDAR_SOURCE } from '../../data/calendarData';
import {
  SECTION_BY_ID,
  SECTIONS_BY_CODE,
  sectionSummary,
  colourFor,
} from '../../utils/routineSolver';
import { generateICS, downloadICS } from '../../utils/icsGenerator';
import { addFydpToRoutine, removeFydpFromRoutine, ROUTINE_STORAGE_KEY } from '../../utils/routineStore';
import { inferFydp, matchFydpStage, readFydpDecision, writeFydpDecision } from '../../utils/fydp';

/**
 * Class Routine — upload → preview → .ics.
 *
 * The add-course search / section picker / solver UI is intentionally gone:
 * there is no section data for the next semester yet. It returns together with
 * the new faculty list (see git history for the previous implementation).
 *
 * Only PDF-imported routines persist (entries carry `customSection`);
 * solver-era selections referencing retired section data are ignored.
 *
 * FYDP / capstone courses have no class meetings, so they never show up on the
 * routine PDF. The student is asked to confirm them instead, and they are kept
 * in the routine so tuition counts them.
 */
export function RoutineView({ courses = [] }) {
  const { showToast } = useToast();

  const [selectedCourses, setSelectedCourses] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ez_routine_selected') || '[]');
      if (Array.isArray(saved)) return saved.filter((c) => c.customSection);
    } catch {}
    return [];
  });
  const [calId, setCalId] = useState(CALENDARS_DATA[0]?.id || '');
  const [isUcamModalOpen, setIsUcamModalOpen] = useState(false);
  const [fydpDecision, setFydpDecision] = useState(() => readFydpDecision());
  const [fydpSelection, setFydpSelection] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem('ez_routine_selected', JSON.stringify(selectedCourses));
    } catch {}
  }, [selectedCourses]);

  const activeCalendar = useMemo(
    () => CALENDARS_DATA.find((c) => c.id === calId) || CALENDARS_DATA[0],
    [calId]
  );
  const calendarFetched = useMemo(() => {
    try {
      return new Date(CALENDAR_SOURCE.fetchedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, []);

  const activeSections = useMemo(() => {
    const list = [];
    selectedCourses.forEach((c) => {
      if (c.customSection) list.push(c.customSection);
      else if (c.sectionId && SECTION_BY_ID[c.sectionId]) list.push(SECTION_BY_ID[c.sectionId]);
      else {
        const secs = SECTIONS_BY_CODE[c.code] || [];
        if (secs.length === 1) list.push(secs[0]);
      }
    });
    return list;
  }, [selectedCourses]);

  const totalCredits = activeSections.reduce((s, x) => s + (x.credit || 0), 0);
  const hasRoutine = activeSections.length > 0;

  // ---- FYDP (no class meetings, so it never lands on the routine PDF) ----
  const fydp = useMemo(() => inferFydp(courses), [courses]);

  const routineFydpCodes = useMemo(
    () => new Set(activeSections.map((s) => matchFydpStage(s.code)?.code).filter(Boolean)),
    [activeSections]
  );

  const missingFydpStages = useMemo(
    () => fydp.candidates.filter((c) => !routineFydpCodes.has(c.code)),
    [fydp.candidates, routineFydpCodes]
  );

  // Pre-select the stage the transcript points to, so the student only confirms.
  useEffect(() => {
    if (fydpDecision || !missingFydpStages.length) return;
    const suggested =
      fydp.inferred && missingFydpStages.some((s) => s.code === fydp.inferred.code)
        ? fydp.inferred.code
        : missingFydpStages[0].code;
    setFydpSelection([suggested]);
  }, [fydpDecision, missingFydpStages, fydp.inferred]);

  const readStoredRoutine = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(ROUTINE_STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter((c) => c.customSection) : [];
    } catch {
      return [];
    }
  };

  const handleFydpAccept = () => {
    const stages = fydp.candidates.filter((c) => fydpSelection.includes(c.code));
    if (!stages.length) return;
    stages.forEach((s) => addFydpToRoutine(s));
    writeFydpDecision({ stages });
    setFydpDecision({ stages });
    setFydpSelection([]);
    setSelectedCourses(readStoredRoutine());
    showToast(`Added ${stages.map((s) => s.code).join(', ')} to your routine`, 'success');
  };

  const handleFydpDismiss = () => {
    writeFydpDecision({ dismissed: true });
    setFydpDecision({ stages: [], dismissed: true });
    showToast('FYDP not registered this term', 'info');
  };

  const handleFydpRemove = (code) => {
    removeFydpFromRoutine(code);
    setSelectedCourses(readStoredRoutine());
    showToast(`Removed ${code} from your routine`, 'info');
  };

  const exportICS = () => {
    try {
      if (!activeSections.length) {
        showToast('Upload your routine PDF first', 'error');
        return;
      }
      const begin = (activeCalendar?.events || []).find((e) => /classes begin/i.test(e.text));
      const lastExam = [...(activeCalendar?.events || [])]
        .filter((e) => /final exam/i.test(e.text))
        .sort((a, b) => (a.end > b.end ? -1 : 1))[0];
      const firstDate = begin?.start || '2026-10-27';
      const lastDate = lastExam?.end || '2027-02-15';

      const { content, stats } = generateICS({
        sections: activeSections,
        customCourses: [],
        calendar: activeCalendar,
        firstDateStr: firstDate,
        lastDateStr: lastDate,
        alarmEnabled: true,
        alarmMinutes: 15,
      });
      downloadICS(
        content,
        `UIU_Routine_${activeCalendar ? `${activeCalendar.term}_${activeCalendar.year}` : 'Routine'}.ics`
      );
      showToast(
        stats.classes
          ? `Exported ${stats.classes} classes to your calendar`
          : 'No fixed class times to export',
        stats.classes ? 'success' : 'info'
      );
    } catch (e) {
      showToast(e.message || 'Error generating calendar', 'error');
    }
  };

  const openUpload = () => setIsUcamModalOpen(true);

  const uploadButton = (
    <Button variant="primary" icon={FileUp} onClick={openUpload}>
      Upload Routine PDF
    </Button>
  );

  const calendarSelect = (
    <Select
      value={calId}
      onChange={(e) => setCalId(e.target.value)}
      className="min-w-[240px] sm:w-[360px]"
    >
      {CALENDARS_DATA.map((c) => (
        <option key={c.id} value={c.id}>
          {c.label || c.title || `${c.term} ${c.year} (${c.program || c.kind})`}
        </option>
      ))}
    </Select>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Class Routine</h1>
          <p className="mt-0.5 text-xs text-ink-3">
            <span className="font-semibold text-ink-2">
              {activeCalendar?.label || activeCalendar?.title || 'UIU Academic Calendar'}
            </span>{' '}
            · Upload your class routine PDF → timetable preview &amp; .ics
            {calendarFetched && (
              <>
                {' '}
                · Calendar from{' '}
                <span className="font-semibold text-ink-2">uiu.ac.bd</span> ({calendarFetched})
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {calendarSelect}
          <Button
            variant="secondary"
            icon={Download}
            onClick={exportICS}
            disabled={!hasRoutine}
            title={hasRoutine ? 'Download .ics' : 'Upload your routine PDF first'}
          >
            Export .ics
          </Button>
          {uploadButton}
        </div>
      </div>

      {missingFydpStages.length > 0 && !fydpDecision && (
        <FydpNotice
          candidates={missingFydpStages}
          selected={fydpSelection}
          onToggle={(code) =>
            setFydpSelection((prev) =>
              prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
            )
          }
          onAccept={handleFydpAccept}
          onDismiss={handleFydpDismiss}
          context={
            fydp.basis === 'running'
              ? 'Your transcript shows an FYDP course running this term. FYDP has no fixed class times, so it does not appear on the routine PDF — but it still counts toward your registration and tuition.'
              : fydp.completed.length
                ? `Your transcript shows ${fydp.completed.join(' and ')} completed, so you are most likely in ${fydp.inferred?.label || 'the next FYDP stage'}. FYDP has no fixed class times, so it is missing from the routine PDF.`
                : 'FYDP has no fixed class times, so it does not appear on the routine PDF — but it still counts toward your registration and tuition.'
          }
        />
      )}

      {!hasRoutine ? (
        <Empty
          icon={FileUp}
          title="No routine loaded yet"
          sub="Upload your UIU class routine PDF — the weekly timetable preview and .ics export unlock right after."
          action={uploadButton}
        />
      ) : (
        <>
          {/* imported routine summary */}
          <Surface className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-bold tracking-tight text-ink">Your Routine</h3>
                <p className="mt-0.5 text-xs text-ink-3">
                  <span className="num font-bold text-ink-2">{activeSections.length}</span> courses ·{' '}
                  <span className="num font-bold text-ink-2">{totalCredits}</span> credits ·
                  registered this term
                </p>
              </div>
              <Button variant="secondary" icon={FileUp} onClick={openUpload}>
                Replace PDF
              </Button>
            </div>
            <ul className="mt-3 divide-y divide-line/60">
              {activeSections.map((sec) => {
                const fydpStage = matchFydpStage(sec.code);
                const hasMeetings = (sec.meetings || []).length > 0;
                return (
                  <li
                    key={sec.id}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5"
                  >
                    <span className="font-mono text-[13px] font-bold text-accent">{sec.code}</span>
                    <span className="num shrink-0 rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink-3">
                      {fydpStage ? fydpStage.label : `Sec ${sec.section}`} · {sec.credit || 0} cr
                    </span>
                    <span className="min-w-[10rem] flex-1 text-[13px] text-ink">{sec.title}</span>
                    <span className="text-[11px] text-ink-3">
                      {hasMeetings ? sectionSummary(sec) : 'No fixed class times'}
                    </span>
                    {fydpStage && (
                      <button
                        type="button"
                        onClick={() => handleFydpRemove(sec.code)}
                        className="rounded-md p-1 text-ink-3 transition-colors hover:text-bad"
                        title={`Remove ${sec.code} from your routine`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Surface>

          {/* clash banner */}
          <ClashBanner sections={activeSections} />

          {/* timetable */}
          <Timetable sections={activeSections} />

          {/* legend */}
          <div className="flex flex-wrap gap-1.5">
            {activeSections.map((s) => (
              <motion.span
                key={s.id}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-ink-2 shadow-card"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: `color-mix(in srgb, ${colourFor(s.code)} 70%, transparent)` }}
                />
                {s.code}
                {s.section ? ` · ${s.section}` : ''}
              </motion.span>
            ))}
          </div>
        </>
      )}

      <UcamRoutineUploadModal
        open={isUcamModalOpen}
        onClose={() => setIsUcamModalOpen(false)}
        onApplyToRoutine={(selectedList, parsedResult) => {
          setSelectedCourses(selectedList);
          if (parsedResult?.matchedCalendar?.id) {
            setCalId(parsedResult.matchedCalendar.id);
          }
        }}
      />
    </div>
  );
}

function ClashBanner({ sections }) {
  const clashes = [];
  const all = sections.flatMap((s) => (s.meetings || []).map((m) => ({ m, s })));
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i];
      const b = all[j];
      if (a.m[0] === b.m[0] && a.m[1] < b.m[2] && b.m[1] < a.m[2]) {
        clashes.push(`${a.s.code} × ${b.s.code} on ${a.m[0]}`);
      }
    }
  }
  if (!clashes.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-start gap-2.5 rounded-2xl border border-bad/30 bg-bad/[0.08] p-4"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bad" strokeWidth={2.2} />
      <p className="text-xs leading-relaxed text-bad">
        <b>{clashes.length} section clash(es):</b> {clashes.join(' · ')} — these classes overlap in
        your uploaded routine.
      </p>
    </motion.div>
  );
}

export default RoutineView;
