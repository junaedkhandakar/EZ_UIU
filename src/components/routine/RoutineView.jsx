import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Wand2,
  Download,
  AlertTriangle,
  Check,
  Trophy,
} from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Empty from '../ui/Empty';
import Timetable from './Timetable';
import { useToast } from '../../context/ToastContext';
import { CALENDARS_DATA } from '../../data/calendarData';
import {
  searchCourses,
  solveRoutine,
  SECTION_BY_ID,
  SECTIONS_BY_CODE,
  COURSE_BY_CODE,
  fmtTime,
  sectionSummary,
  scoreSchedule,
  colourFor,
} from '../../utils/routineSolver';
import { generateICS, downloadICS } from '../../utils/icsGenerator';

const FREE_DAY_OPTIONS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed'];

export function RoutineView() {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [selectedCourses, setSelectedCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('ez_routine_selected');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [daysOff, setDaysOff] = useState([]);
  const [earliestTime, setEarliestTime] = useState('');
  const [latestTime, setLatestTime] = useState('');
  const [solvedOptions, setSolvedOptions] = useState([]);
  const [optionIndex, setOptionIndex] = useState(0);
  const [calId, setCalId] = useState(CALENDARS_DATA[0]?.id || '');
  const searchRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('ez_routine_selected', JSON.stringify(selectedCourses));
    } catch {}
  }, [selectedCourses]);

  const results = useMemo(() => searchCourses(query, programFilter), [query, programFilter]);
  const activeCalendar = useMemo(
    () => CALENDARS_DATA.find((c) => c.id === calId) || CALENDARS_DATA[0],
    [calId]
  );

  /* active sections for the timetable */
  const activeSections = useMemo(() => {
    const list = [];
    selectedCourses.forEach((c) => {
      if (c.sectionId && SECTION_BY_ID[c.sectionId]) list.push(SECTION_BY_ID[c.sectionId]);
      else {
        const secs = SECTIONS_BY_CODE[c.code] || [];
        if (secs.length === 1) list.push(secs[0]);
      }
    });
    return list;
  }, [selectedCourses]);

  const liveScore = useMemo(
    () => (activeSections.length ? scoreSchedule(activeSections) : null),
    [activeSections]
  );
  const totalCredits = activeSections.reduce((s, x) => s + (x.credit || 0), 0);

  /* handlers */
  const addCourse = (code) => {
    if (selectedCourses.some((c) => c.code === code)) {
      showToast(`${code} is already added`, 'info');
      return;
    }
    const secs = SECTIONS_BY_CODE[code] || [];
    setSelectedCourses((prev) => [
      ...prev,
      { code, sectionId: secs.length === 1 ? secs[0].id : null },
    ]);
    setQuery('');
    showToast(`Added ${code}`, 'success');
  };

  const removeCourse = (code) => {
    setSelectedCourses((prev) => prev.filter((c) => c.code !== code));
    setSolvedOptions([]);
    showToast(`Removed ${code}`, 'info');
  };

  const pickSection = (code, sectionId) =>
    setSelectedCourses((prev) =>
      prev.map((c) => (c.code === code ? { ...c, sectionId: sectionId || null } : c))
    );

  const applyOption = (option) => {
    if (!option) return;
    const map = {};
    option.sections.forEach((s) => {
      map[s.code] = s.id;
    });
    setSelectedCourses((prev) =>
      prev.map((c) => (map[c.code] !== undefined ? { ...c, sectionId: map[c.code] } : c))
    );
  };

  const solve = () => {
    const res = solveRoutine({ selectedCourses, customCourses: [], daysOff, earliestTime, latestTime });
    if (res.success && res.options.length) {
      setSolvedOptions(res.options);
      setOptionIndex(0);
      applyOption(res.options[0]);
      showToast(res.message, 'success');
    } else {
      setSolvedOptions([]);
      showToast(res.message, 'error');
    }
  };

  const exportICS = () => {
    try {
      if (!activeSections.length) {
        showToast('Select sections before exporting', 'error');
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
        `UIU_Routine_${activeCalendar ? `${activeCalendar.term}_${activeCalendar.year}` : 'Fall_2026'}.ics`
      );
      showToast(`Exported ${stats.classes} classes to your calendar`, 'success');
    } catch (e) {
      showToast(e.message || 'Error generating calendar', 'error');
    }
  };

  const toggleDayOff = (d) =>
    setDaysOff((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const selectedCodes = new Set(selectedCourses.map((c) => c.code));

  return (
    <div className="view-in flex flex-col gap-5">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
            {activeCalendar ? `${activeCalendar.term} ${activeCalendar.year}` : 'Fall 2026'} ·
            clash-free solver
          </div>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink sm:text-3xl">
            Routine Builder
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={calId} onChange={(e) => setCalId(e.target.value)} className="w-[190px]">
            {CALENDARS_DATA.map((c) => (
              <option key={c.id} value={c.id}>
                {`${c.term} ${c.year}`.replace(/\b\w/g, (ch) => ch.toUpperCase())}
              </option>
            ))}
          </Select>
          <Button variant="primary" icon={Wand2} onClick={solve}>
            Auto-generate
          </Button>
          <Button variant="secondary" icon={Download} onClick={exportICS}>
            Export .ics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* ============ LEFT: enrollment panel ============ */}
        <div className="flex flex-col gap-4 xl:col-span-5">
          {/* search */}
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">Add courses</h3>
              <Select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-[110px]"
              >
                <option value="all">All programs</option>
                <option value="BSCSE">BSCSE</option>
                <option value="BSDS">BSDS</option>
              </Select>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search code, title, or faculty…"
                className="h-10 w-full rounded-xl border border-line bg-surface2/70 py-2 pl-9 pr-3 text-[13px] text-ink placeholder-ink-3 transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              {query.trim().length >= 2 && (
                <div className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-[280px] overflow-y-auto rounded-xl border border-line bg-surface shadow-pop fade-in">
                  {results.length === 0 ? (
                    <div className="px-3.5 py-3 text-xs text-ink-3">No matches found</div>
                  ) : (
                    results.map((c) => {
                      const added = selectedCodes.has(c.code);
                      return (
                        <button
                          key={c.code}
                          onClick={() => addCourse(c.code)}
                          disabled={added}
                          className="flex w-full items-center justify-between gap-3 border-b border-line/60 px-3.5 py-2.5 text-left transition-colors last:border-0 hover:bg-surface2 disabled:opacity-40"
                        >
                          <span className="min-w-0">
                            <span className="mr-2 font-bold text-accent">{c.code}</span>
                            <span className="text-xs text-ink-2">{c.title}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <span className="num rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink-3">
                              {c.credit} cr
                            </span>
                            {added ? (
                              <Check className="h-3.5 w-3.5 text-ok" />
                            ) : (
                              <Plus className="h-3.5 w-3.5 text-ink-3" />
                            )}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* enrolled list */}
          <div className="rounded-2xl border border-line bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">
                Enrolled
                <span className="num ml-2 rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink-3">
                  {selectedCourses.length}
                </span>
              </h3>
              {totalCredits > 0 && (
                <span className="num text-[11px] font-bold text-accent">{totalCredits} credits</span>
              )}
            </div>
            {selectedCourses.length === 0 ? (
              <Empty
                icon={Search}
                title="No courses yet"
                sub="Search above to add courses, then hit Auto-generate for a clash-free routine."
                className="m-3 border-0"
              />
            ) : (
              <ul className="divide-y divide-line/60">
                {selectedCourses.map((sel) => {
                  const meta = COURSE_BY_CODE[sel.code] || {};
                  const secs = SECTIONS_BY_CODE[sel.code] || [];
                  const activeSec = sel.sectionId ? SECTION_BY_ID[sel.sectionId] : null;
                  return (
                    <li key={sel.code} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-bold text-ink">{sel.code}</span>
                            <span className="num shrink-0 text-[10px] font-semibold text-ink-3">
                              {meta.credit || ''} cr
                            </span>
                          </div>
                          <div className="truncate text-[11px] text-ink-3">{meta.title || ''}</div>
                          {activeSec && (
                            <div className="mt-1 text-[10.5px] font-medium text-ink-2">
                              {sectionSummary(activeSec)}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeCourse(sel.code)}
                          className="rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-bad/10 hover:text-bad"
                          title={`Remove ${sel.code}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Select
                        value={sel.sectionId || ''}
                        onChange={(e) => pickSection(sel.code, e.target.value)}
                        className="mt-2"
                      >
                        <option value="">Auto — let solver decide</option>
                        {secs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {sectionSummary(s)}
                          </option>
                        ))}
                      </Select>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* constraints */}
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Constraints</h3>
            <div className="mt-3.5">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">
                Free days
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FREE_DAY_OPTIONS.map((d) => {
                  const on = daysOff.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDayOff(d)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                        on
                          ? 'border-accent bg-accentSoft text-accent'
                          : 'border-line bg-surface2/70 text-ink-2 hover:text-ink'
                      }`}
                    >
                      {on && <Check className="mr-1 inline h-3 w-3" />}
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">
                  No classes before
                </label>
                <input
                  type="time"
                  value={earliestTime}
                  onChange={(e) => setEarliestTime(e.target.value)}
                  className="num w-full rounded-xl border border-line bg-surface2/70 px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">
                  No classes after
                </label>
                <input
                  type="time"
                  value={latestTime}
                  onChange={(e) => setLatestTime(e.target.value)}
                  className="num w-full rounded-xl border border-line bg-surface2/70 px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============ RIGHT: solver + timetable ============ */}
        <div className="flex flex-col gap-4 xl:col-span-7">
          {/* score strip */}
          {liveScore && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-accent/25 bg-accentSoft/40 p-3.5 text-center shadow-card">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-accent">
                  Fit score
                </div>
                <div className="num mt-1 text-[24px] font-extrabold leading-none tracking-tight text-accent">
                  {liveScore.score}
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-3.5 text-center shadow-card">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
                  Days on campus
                </div>
                <div className="num mt-1 text-[24px] font-extrabold leading-none tracking-tight text-ink">
                  {liveScore.daysUsed}
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-3.5 text-center shadow-card">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
                  Gap minutes
                </div>
                <div className="num mt-1 text-[24px] font-extrabold leading-none tracking-tight text-ink">
                  {liveScore.gaps}
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-3.5 text-center shadow-card">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
                  Window
                </div>
                <div className="num mt-1 whitespace-nowrap text-[15px] font-extrabold leading-none tracking-tight text-ink" style={{ paddingTop: 6 }}>
                  {liveScore.earliest ? fmtTime(liveScore.earliest) : '—'}–
                  {liveScore.latest ? fmtTime(liveScore.latest) : '—'}
                </div>
              </div>
            </div>
          )}

          {/* solver options */}
          {solvedOptions.length > 0 && (
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto rounded-2xl border border-line bg-surface p-2.5 shadow-card">
              <span className="flex shrink-0 items-center gap-1.5 pl-1.5 pr-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-3">
                <Trophy className="h-3.5 w-3.5 text-accent" />
                Options
              </span>
              {solvedOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setOptionIndex(i);
                    applyOption(opt);
                  }}
                  className={`shrink-0 rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition-all active:scale-95 ${
                    optionIndex === i
                      ? 'border-accent bg-accentSoft text-accent'
                      : 'border-line bg-surface2/70 text-ink-2 hover:text-ink'
                  }`}
                >
                  Option {i + 1} · {opt.metrics.score}
                </button>
              ))}
            </div>
          )}

          {/* clash banner */}
          {activeSections.length > 0 && (
            <ClashBanner sections={activeSections} />
          )}

          {/* timetable */}
          <Timetable sections={activeSections} />

          {/* legend */}
          {activeSections.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeSections.map((s) => (
                <span
                  key={s.id}
                  className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-ink-2 shadow-card"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: `color-mix(in srgb, ${colourFor(s.code)} 70%, transparent)` }}
                  />
                  {s.code} · {s.section}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* inline clash banner component */
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
    <div className="flex items-start gap-2.5 rounded-2xl border border-bad/30 bg-bad/[0.08] p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bad" strokeWidth={2.2} />
      <p className="text-xs leading-relaxed text-bad">
        <b>{clashes.length} section clash(es):</b> {clashes.join(' · ')} — unlock a section or run
        Auto-generate for a clash-free combination.
      </p>
    </div>
  );
}

export default RoutineView;
