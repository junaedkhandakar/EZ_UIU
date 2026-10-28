import React, { useMemo } from 'react';
import { DAYS, fmtTime, colourFor, pad2 } from '../../utils/routineSolver';

const HOUR_H = 56; // px per hour

export default function Timetable({ sections = [] }) {
  const model = useMemo(() => {
    const meetings = sections.flatMap((s) =>
      (s.meetings || []).map((m) => ({ ...m, sec: s }))
    );
    if (!meetings.length) return null;

    let startMin = Math.floor(Math.min(...meetings.map((m) => m[1])) / 60) * 60;
    let endMin = Math.ceil(Math.max(...meetings.map((m) => m[2])) / 60) * 60;
    startMin = Math.max(0, startMin - 60);
    endMin = Math.min(24 * 60, endMin + 60);
    const hours = [];
    for (let h = startMin; h < endMin; h += 60) hours.push(h);

    const totalMin = endMin - startMin;
    const height = (totalMin / 60) * HOUR_H;
    const y = (m) => ((m - startMin) / 60) * HOUR_H;

    // clash detection: overlapping meetings on same day from different sections
    const clashIds = new Set();
    DAYS.forEach((d) => {
      const list = meetings.filter((m) => m[0] === d).sort((a, b) => a[1] - b[1]);
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (list[i][1] < list[j][2] && list[j][1] < list[i][2]) {
            clashIds.add(list[i].sec.id);
            clashIds.add(list[j].sec.id);
          }
        }
      }
    });

    const byDay = {};
    DAYS.forEach((d) => {
      byDay[d] = meetings
        .filter((m) => m[0] === d)
        .map((m) => ({
          sec: m.sec,
          start: m[1],
          end: m[2],
          room: m[3] || '',
          top: y(m[1]),
          height: Math.max(22, y(m[2]) - y(m[1]) - 3),
          color: colourFor(m.sec.code),
          clash: clashIds.has(m.sec.id),
        }));
    });

    return { hours, height, byDay, hasClash: clashIds.size > 0 };
  }, [sections]);

  if (!model) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-line-strong text-sm text-ink-3">
        Add courses and pick sections to preview your weekly routine.
      </div>
    );
  }

  const { hours, height, byDay, hasClash } = model;

  return (
    <div
      className={`overflow-x-auto rounded-2xl border bg-surface shadow-card ${
        hasClash ? 'border-bad/40' : 'border-line'
      }`}
    >
      <div className="min-w-[640px]">
        {/* header row */}
        <div className="flex border-b border-line">
          <div className="w-12 shrink-0" />
          {DAYS.map((d) => (
            <div
              key={d}
              className="flex-1 border-l border-line px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-ink-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* body */}
        <div className="flex" style={{ height }}>
          {/* time gutter */}
          <div className="relative w-12 shrink-0">
            {hours.map((h) => (
              <div
                key={h}
                className="num absolute right-2 -translate-y-1/2 text-[10px] font-semibold text-ink-3"
                style={{ top: ((h - hours[0]) / 60) * HOUR_H }}
              >
                {pad2(h / 60)}:00
              </div>
            ))}
          </div>

          {/* day columns */}
          {DAYS.map((d) => (
            <div key={d} className="relative flex-1 border-l border-line">
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-line/60"
                  style={{ top: ((h - hours[0]) / 60) * HOUR_H }}
                />
              ))}
              {byDay[d].map((b, i) => (
                <div
                  key={`${b.sec.id}-${i}`}
                  title={`${b.sec.code} (${b.sec.section}) · ${fmtTime(b.start)}–${fmtTime(b.end)}${b.room ? ` · ${b.room}` : ''}`}
                  className={`group absolute left-1 right-1.5 cursor-default overflow-hidden rounded-xl border px-2.5 py-1.5 transition-all hover:scale-[1.02] hover:shadow-lift ${
                    b.clash ? 'z-20 ring-2 ring-bad' : ''
                  }`}
                  style={{
                    top: b.top,
                    height: b.height,
                    borderLeftWidth: 3,
                    borderColor: `color-mix(in srgb, ${b.color} 35%, transparent)`,
                    borderLeftColor: b.color,
                    background: `color-mix(in srgb, ${b.color} 16%, var(--surface))`,
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[11.5px] font-bold text-ink">{b.sec.code}</span>
                    <span
                      className="num shrink-0 rounded-md px-1 py-0.5 text-[9px] font-bold"
                      style={{ background: `color-mix(in srgb, ${b.color} 22%, transparent)` }}
                    >
                      {b.sec.section}
                    </span>
                  </div>
                  {b.height >= 46 && (
                    <div className="num mt-0.5 truncate text-[9.5px] font-medium text-ink-2">
                      {fmtTime(b.start)}–{fmtTime(b.end)}
                      {b.room ? ` · ${b.room}` : ''}
                    </div>
                  )}
                  {b.height >= 68 && (
                    <div className="mt-0.5 truncate text-[9.5px] text-ink-3">{b.sec.title}</div>
                  )}
                  {b.clash && (
                    <div className="mt-1 inline-flex rounded-md bg-bad/15 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-bad">
                      Clash
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
