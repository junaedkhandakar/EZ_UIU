import React from 'react';
import { DAYS, fmtTime, colourFor, overlaps } from '../../utils/routineSolver';
import { Calendar, AlertCircle } from 'lucide-react';

export function TimetableGrid({
  selectedSections = [],
  customCourses = [],
  onBlockClick,
}) {
  // Aggregate all meetings
  const allMeetings = [];
  selectedSections.forEach(sec => {
    (sec.meetings || []).forEach(m => {
      allMeetings.push({
        day: m[0],
        start: m[1],
        end: m[2],
        room: m[3] || '',
        code: sec.code,
        title: sec.title,
        section: sec.section,
        faculty: (sec.faculty || []).join(', '),
        colorKey: sec.code,
        custom: false,
      });
    });
  });

  customCourses.forEach(c => {
    (c.meetings || []).forEach(m => {
      allMeetings.push({
        day: m[0],
        start: m[1],
        end: m[2],
        room: m[3] || '',
        code: 'CUSTOM',
        title: c.title,
        section: '',
        faculty: c.faculty || '',
        colorKey: c.id,
        custom: true,
      });
    });
  });

  // Calculate conflicts
  const clashIndices = new Set();
  for (let i = 0; i < allMeetings.length; i++) {
    for (let j = i + 1; j < allMeetings.length; j++) {
      if (overlaps(
        [allMeetings[i].day, allMeetings[i].start, allMeetings[i].end],
        [allMeetings[j].day, allMeetings[j].start, allMeetings[j].end]
      )) {
        clashIndices.add(i);
        clashIndices.add(j);
      }
    }
  }

  if (allMeetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-96 rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] text-center">
        <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-zinc-400 mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
          Your Weekly Routine Canvas
        </h4>
        <p className="text-xs text-zinc-400 max-w-sm mt-1">
          Search courses on the left and select sections, or click <b>Auto-generate</b> to solve a clash-free schedule.
        </p>
      </div>
    );
  }

  // Geometry: 8:30 AM (510 min) to 5:00 PM (1020 min) minimum
  let minStart = Math.min(...allMeetings.map(m => m.start));
  let maxEnd = Math.max(...allMeetings.map(m => m.end));
  minStart = Math.floor(Math.min(minStart, 8 * 60) / 60) * 60;
  maxEnd = Math.ceil(Math.max(maxEnd, 17 * 60) / 60) * 60;
  if (maxEnd - minStart < 240) maxEnd = minStart + 240;

  const span = maxEnd - minStart;
  const gridHeight = Math.max(480, Math.round(((maxEnd - minStart) / 60) * 72));

  // Hour labels
  const hourMarks = [];
  for (let h = minStart; h <= maxEnd; h += 60) {
    hourMarks.push(h);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Clash Warning */}
      {clashIndices.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-semibold animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Class timing conflict detected between overlapping sections! Choose another section or run the solver.</span>
        </div>
      )}

      {/* Timetable Canvas */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm overflow-x-auto">
        <div style={{ minWidth: '700px' }} className="p-4 select-none">
          {/* Header Row: Days */}
          <div className="grid grid-cols-6 border-b border-black/[0.06] dark:border-white/[0.08] pb-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
            <div className="text-center font-mono text-[10px] uppercase text-zinc-400">
              Time
            </div>
            {DAYS.map(day => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="relative grid grid-cols-6" style={{ height: `${gridHeight}px` }}>
            {/* Time labels column */}
            <div className="relative border-r border-black/[0.04] dark:border-white/[0.06]">
              {hourMarks.map(h => {
                const topPercent = ((h - minStart) / span) * 100;
                return (
                  <div
                    key={h}
                    className="absolute right-2 -translate-y-1/2 text-[10px] font-mono font-medium text-zinc-400"
                    style={{ top: `${topPercent}%` }}
                  >
                    {fmtTime(h)}
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {DAYS.map(day => {
              const dayMeetings = allMeetings.filter(m => m.day === day);

              return (
                <div
                  key={day}
                  className="relative border-r last:border-r-0 border-black/[0.04] dark:border-white/[0.06]"
                >
                  {/* Horizontal Hour Guidelines */}
                  {hourMarks.map(h => {
                    const topPercent = ((h - minStart) / span) * 100;
                    return (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-black/[0.04] dark:border-white/[0.06]"
                        style={{ top: `${topPercent}%` }}
                      />
                    );
                  })}

                  {/* Class Meeting Blocks */}
                  {dayMeetings.map((m, idx) => {
                    const globalIdx = allMeetings.indexOf(m);
                    const isConflict = clashIndices.has(globalIdx);
                    const topPercent = ((m.start - minStart) / span) * 100;
                    const heightPercent = ((m.end - m.start) / span) * 100;
                    const color = colourFor(m.colorKey);

                    return (
                      <div
                        key={`${m.code}-${m.start}-${idx}`}
                        className={`absolute left-1 right-1 rounded-xl p-2 text-white overflow-hidden transition-all shadow-sm ${
                          isConflict ? 'ring-2 ring-rose-500 animate-pulse' : 'hover:scale-[1.02]'
                        }`}
                        style={{
                          top: `${topPercent}%`,
                          height: `${heightPercent}%`,
                          backgroundColor: color,
                        }}
                        title={`${m.code} (${m.section}) - ${m.title}\n${fmtTime(m.start)} – ${fmtTime(m.end)}${m.room ? `\nRoom ${m.room}` : ''}${m.faculty ? `\nFaculty: ${m.faculty}` : ''}`}
                      >
                        <div className="flex flex-col h-full justify-between leading-tight">
                          <div>
                            <div className="font-extrabold text-[11px] truncate flex items-center justify-between">
                              <span>{m.code}</span>
                              {m.section && (
                                <span className="text-[9px] bg-black/20 px-1 py-0.2 rounded">
                                  {m.section}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] opacity-90 truncate font-medium">
                              {m.title}
                            </div>
                          </div>

                          <div className="text-[9px] font-mono opacity-80 flex items-center justify-between pt-1">
                            <span>{fmtTime(m.start)}</span>
                            {m.room && <span>Rm {m.room}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
