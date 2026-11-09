import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Download, AlertTriangle, FileUp } from 'lucide-react';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import Select from '../ui/Select';
import Empty from '../ui/Empty';
import Timetable from './Timetable';
import UcamRoutineUploadModal from './UcamRoutineUploadModal';
import { useToast } from '../../context/ToastContext';
import { CALENDARS_DATA, CALENDAR_SOURCE } from '../../data/calendarData';
import {
  SECTION_BY_ID,
  SECTIONS_BY_CODE,
  sectionSummary,
  colourFor,
} from '../../utils/routineSolver';
import { generateICS, downloadICS } from '../../utils/icsGenerator';

/**
 * Class Routine — upload → preview → .ics.
 *
 * The add-course search / section picker / solver UI is intentionally gone:
 * there is no section data for the next semester yet. It returns together with
 * the new faculty list (see git history for the previous implementation).
 *
 * Only PDF-imported routines persist (entries carry `customSection`);
 * solver-era selections referencing retired section data are ignored.
 */
export function RoutineView() {
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
      showToast(`Exported ${stats.classes} classes to your calendar`, 'success');
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
    <Select value={calId} onChange={(e) => setCalId(e.target.value)} className="w-[190px]">
      {CALENDARS_DATA.map((c) => (
        <option key={c.id} value={c.id}>
          {`${c.term} ${c.year}`.replace(/\b\w/g, (ch) => ch.toUpperCase())}
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
            {activeCalendar
              ? `${activeCalendar.term} ${activeCalendar.year}`.replace(/\b\w/g, (ch) => ch.toUpperCase())
              : 'UIU'}{' '}
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
                  <span className="num font-bold text-ink-2">{activeSections.length}</span> sections ·{' '}
                  <span className="num font-bold text-ink-2">{totalCredits}</span> credits · imported
                  from your PDF
                </p>
              </div>
              <Button variant="secondary" icon={FileUp} onClick={openUpload}>
                Replace PDF
              </Button>
            </div>
            <ul className="mt-3 divide-y divide-line/60">
              {activeSections.map((sec) => (
                <li
                  key={sec.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5"
                >
                  <span className="font-mono text-[13px] font-bold text-accent">{sec.code}</span>
                  <span className="num shrink-0 rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink-3">
                    Sec {sec.section} · {sec.credit || 0} cr
                  </span>
                  <span className="min-w-[10rem] flex-1 text-[13px] text-ink">{sec.title}</span>
                  <span className="text-[11px] text-ink-3">{sectionSummary(sec)}</span>
                </li>
              ))}
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
                {s.code} · {s.section}
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
