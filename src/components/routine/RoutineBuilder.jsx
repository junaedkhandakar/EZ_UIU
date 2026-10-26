import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { TimetableGrid } from './TimetableGrid';
import {
  COURSES,
  SECTIONS,
  COURSE_BY_CODE,
  SECTION_BY_ID,
  SECTIONS_BY_CODE,
  DAYS,
  searchCourses,
  sectionSummary,
  solveRoutine,
  scoreSchedule,
} from '../../utils/routineSolver';
import { CALENDARS_DATA } from '../../data/calendarData';
import { generateICS, downloadICS } from '../../utils/icsGenerator';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Check,
  ChevronRight,
  Layers,
} from 'lucide-react';

export function RoutineBuilder() {
  const { showToast } = useToast();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('all');

  // Selected courses: [ { code: 'CSE 1115', sectionId: '123' | null } ]
  const [selectedCourses, setSelectedCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('ez_routine_selected');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default starting courses
    return [
      { code: 'CSE 2215', sectionId: null },
      { code: 'CSE 2216', sectionId: null },
      { code: 'CSE 2213', sectionId: null },
    ];
  });

  // Solver constraints
  const [daysOff, setDaysOff] = useState([]);
  const [earliestTime, setEarliestTime] = useState('');
  const [latestTime, setLatestTime] = useState('');

  // Solver results
  const [solvedOptions, setSolvedOptions] = useState([]);
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);

  // Academic Calendar
  const [selectedCalId, setSelectedCalId] = useState(CALENDARS_DATA[0]?.id || '');
  const activeCalendar = useMemo(() => {
    return CALENDARS_DATA.find(c => c.id === selectedCalId) || CALENDARS_DATA[0];
  }, [selectedCalId]);

  // Persist selections
  useEffect(() => {
    try {
      localStorage.setItem('ez_routine_selected', JSON.stringify(selectedCourses));
    } catch (e) {}
  }, [selectedCourses]);

  // Search results
  const searchResults = useMemo(() => {
    return searchCourses(searchQuery, programFilter);
  }, [searchQuery, programFilter]);

  // Active chosen sections for timetable rendering
  const activeSections = useMemo(() => {
    const list = [];
    selectedCourses.forEach(c => {
      if (c.sectionId && SECTION_BY_ID[c.sectionId]) {
        list.push(SECTION_BY_ID[c.sectionId]);
      } else {
        // Fallback: if no section selected, take the first one or leave empty
        const secs = SECTIONS_BY_CODE[c.code];
        if (secs && secs.length === 1) {
          list.push(secs[0]);
        }
      }
    });
    return list;
  }, [selectedCourses]);

  // Add course to list
  const handleAddCourse = code => {
    if (selectedCourses.some(c => c.code === code)) {
      showToast(`${code} is already added`, 'info');
      return;
    }
    const secs = SECTIONS_BY_CODE[code] || [];
    setSelectedCourses(prev => [
      ...prev,
      { code, sectionId: secs.length === 1 ? secs[0].id : null },
    ]);
    setSearchQuery('');
    showToast(`Added ${code}`, 'success');
  };

  const handleRemoveCourse = code => {
    setSelectedCourses(prev => prev.filter(c => c.code !== code));
    setSolvedOptions([]);
    showToast(`Removed ${code}`, 'info');
  };

  const handleSelectSection = (code, sectionId) => {
    setSelectedCourses(prev =>
      prev.map(c => (c.code === code ? { ...c, sectionId: sectionId || null } : c))
    );
  };

  // Run Solver
  const handleSolve = () => {
    const res = solveRoutine({
      selectedCourses,
      customCourses: [],
      daysOff,
      earliestTime,
      latestTime,
    });

    if (res.success && res.options.length > 0) {
      setSolvedOptions(res.options);
      setActiveOptionIndex(0);
      applyOption(res.options[0]);
      showToast(res.message, 'success');
    } else {
      setSolvedOptions([]);
      showToast(res.message, 'error');
    }
  };

  const applyOption = option => {
    if (!option) return;
    const map = {};
    option.sections.forEach(s => {
      map[s.code] = s.id;
    });

    setSelectedCourses(prev =>
      prev.map(c => ({
        ...c,
        sectionId: map[c.code] !== undefined ? map[c.code] : c.sectionId,
      }))
    );
  };

  // Export .ics calendar
  const handleExportICS = () => {
    try {
      if (!activeSections.length) {
        showToast('Please select sections for your courses before exporting', 'error');
        return;
      }

      // Default start and end dates from calendar events
      const beginEvent = (activeCalendar?.events || []).find(e => /classes begin/i.test(e.text));
      const firstDate = beginEvent?.start || '2026-10-27';
      const lastDate = '2027-02-15'; // End of trimester

      const { content, stats } = generateICS({
        sections: activeSections,
        customCourses: [],
        calendar: activeCalendar,
        firstDateStr: firstDate,
        lastDateStr: lastDate,
        alarmEnabled: true,
        alarmMinutes: 15,
      });

      downloadICS(content, `UIU_Routine_${activeCalendar?.term || 'Fall_2026'}.ics`);
      showToast(`Exported ${stats.classes} classes to .ics calendar!`, 'success');
    } catch (e) {
      showToast(e.message || 'Error generating calendar', 'error');
    }
  };

  const totalCredits = activeSections.reduce((sum, s) => sum + (s.credit || 0), 0);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Routine Builder &amp; Calendar (.ics)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Clash-free section solver for Fall 2026 CSE &amp; BSDS with official UIU academic calendar sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={Download}
            onClick={handleExportICS}
          >
            Export .ics Calendar
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Controls (5 cols), Right Timetable (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Course Search Box */}
          <Card>
            <CardHeader
              title="Add Courses"
              subtitle="Search by code, title, or aliases (e.g. oop, dsa, dbms, os, ml, fydp)"
            />
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. CSE 2215, algo, oop, compiler..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
                />
              </div>

              {/* Live Search Results Dropdown */}
              {searchQuery.trim().length > 0 && (
                <div className="max-h-60 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.06] rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]">
                  {searchResults.length === 0 ? (
                    <div className="p-3 text-center text-xs text-zinc-400">
                      No matching courses found.
                    </div>
                  ) : (
                    searchResults.map(c => {
                      const isAdded = selectedCourses.some(sel => sel.code === c.code);
                      return (
                        <div
                          key={c.code}
                          className="p-3 flex items-center justify-between gap-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-apple-blue">{c.code}</span>
                              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                {c.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400">
                              {c.credit} cr · {c.count} sections · {c.program}
                            </span>
                          </div>
                          <Button
                            size="xs"
                            variant={isAdded ? 'secondary' : 'primary'}
                            disabled={isAdded}
                            onClick={() => handleAddCourse(c.code)}
                          >
                            {isAdded ? 'Added' : 'Add'}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Courses & Section Picker */}
          <Card>
            <CardHeader
              title={`Enrolled Courses (${selectedCourses.length})`}
              subtitle={`${totalCredits} Total Credits Selected`}
              action={
                <Button
                  size="sm"
                  variant="primary"
                  icon={Sparkles}
                  onClick={handleSolve}
                >
                  Auto-generate
                </Button>
              }
            />
            <CardContent>
              {selectedCourses.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No courses added yet. Search above to add courses.
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {selectedCourses.map(sel => {
                    const course = COURSE_BY_CODE[sel.code];
                    const secs = SECTIONS_BY_CODE[sel.code] || [];
                    const activeSec = sel.sectionId ? SECTION_BY_ID[sel.sectionId] : null;

                    return (
                      <div key={sel.code} className="py-3 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                                {sel.code}
                              </span>
                              <span className="text-xs font-semibold text-zinc-500">
                                {course ? `${course.credit} cr` : ''}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              {course?.title}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveCourse(sel.code)}
                            className="text-zinc-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                            title="Remove course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Section Selector */}
                        <div className="flex items-center gap-2">
                          <select
                            value={sel.sectionId || ''}
                            onChange={e => handleSelectSection(sel.code, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none focus:ring-1 focus:ring-apple-blue"
                          >
                            <option value="">Auto — Solver chooses optimal section</option>
                            {secs.map(s => (
                              <option key={s.id} value={s.id}>
                                Section {s.section} · {sectionSummary(s)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solver Preferences */}
          <Card>
            <CardHeader
              title="Solver Constraints & Preferences"
              subtitle="Specify days off and preferred time windows"
            />
            <CardContent className="space-y-4">
              {/* Free Days Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Preferred Free Days (No Class)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {DAYS.map(day => {
                    const isOff = daysOff.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setDaysOff(prev =>
                            isOff ? prev.filter(d => d !== day) : [...prev, day]
                          );
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                          isOff
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-black/[0.03] dark:bg-white/[0.05] border-black/[0.08] dark:border-white/[0.1] text-zinc-700 dark:text-zinc-300 hover:border-black/[0.2]'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Academic Calendar Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Official Academic Calendar
                </label>
                <select
                  value={selectedCalId}
                  onChange={e => setSelectedCalId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none"
                >
                  {CALENDARS_DATA.map(cal => (
                    <option key={cal.id} value={cal.id}>
                      {cal.title} ({cal.year})
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Routine Preview & Solver Results (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Solved Options Carousel */}
          {solvedOptions.length > 0 && (
            <Card className="border-apple-blue/30 bg-apple-blue/[0.02]">
              <CardHeader
                title={`Clash-free Solutions Found (${solvedOptions.length})`}
                subtitle="Ranked by compactness, minimum gap minutes, and free days"
              />
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {solvedOptions.slice(0, 8).map((opt, idx) => {
                    const isCurrent = idx === activeOptionIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActiveOptionIndex(idx);
                          applyOption(opt);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isCurrent
                            ? 'bg-apple-blue text-white border-apple-blue shadow-apple-sm'
                            : 'bg-white dark:bg-[#1c1c1e] border-black/[0.08] dark:border-white/[0.1] text-zinc-800 dark:text-zinc-200 hover:border-apple-blue/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">
                            Option {idx + 1}
                          </span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                            isCurrent ? 'bg-white/20' : 'bg-apple-blue/10 text-apple-blue'
                          }`}>
                            {opt.metrics.score}/100
                          </span>
                        </div>
                        <div className="text-[11px] opacity-80 mt-1">
                          {opt.metrics.daysUsed} days · {opt.metrics.gaps}m gap
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timetable Grid Canvas */}
          <TimetableGrid selectedSections={activeSections} />
        </div>
      </div>
    </div>
  );
}
