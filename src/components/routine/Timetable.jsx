import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin, User, Copy, Check, X, AlertTriangle } from 'lucide-react';
import { DAYS, fmtTime, colourFor, pad2 } from '../../utils/routineSolver';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

const HOUR_H = 56; // px per hour

export default function Timetable({ sections = [], hoveredSection = null }) {
  const { showToast } = useToast();
  const [inspectedSec, setInspectedSec] = useState(null);
  const [copied, setCopied] = useState(false);

  const model = useMemo(() => {
    // If previewing a section on hover, temporarily merge it
    const allSections = hoveredSection
      ? [
          ...sections.filter((s) => s.code !== hoveredSection.code),
          { ...hoveredSection, isPreview: true },
        ]
      : sections;

    const meetings = allSections.flatMap((s) =>
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

    // clash detection
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
          isPreview: !!m.sec.isPreview,
        }));
    });

    return { hours, height, byDay, hasClash: clashIds.size > 0 };
  }, [sections, hoveredSection]);

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    showToast(`Copied "${text}" to clipboard!`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!model) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-line-strong text-sm text-ink-3">
        {sections.length
          ? 'The courses in your routine have no fixed class times.'
          : 'Upload your class routine PDF to preview your weekly timetable.'}
      </div>
    );
  }

  const { hours, height, byDay, hasClash } = model;

  return (
    <>
      <div
        className={`overflow-x-auto rounded-2xl border bg-surface shadow-card transition-colors duration-200 ${
          hasClash ? 'border-bad/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-line'
        }`}
      >
        <div className="min-w-[640px]">
          {/* header row */}
          <div className="flex border-b border-line bg-surface2/40">
            <div className="w-12 shrink-0" />
            {DAYS.map((d) => (
              <div
                key={d}
                className="flex-1 border-l border-line px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-ink-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* body */}
          <div className="flex" style={{ height }}>
            {/* time gutter */}
            <div className="relative w-12 shrink-0 select-none">
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
                <AnimatePresence>
                  {byDay[d].map((b, i) => (
                    <motion.div
                      key={`${b.sec.id}-${i}`}
                      layout
                      initial={{ opacity: 0, scale: 0.92, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      whileHover={{ scale: 1.025, zIndex: 30, transition: { type: 'spring', stiffness: 500, damping: 25 } }}
                      onClick={() => setInspectedSec(b.sec)}
                      title="Click for full course details"
                      className={`group absolute left-1 right-1.5 cursor-pointer overflow-hidden rounded-xl border px-2.5 py-1.5 shadow-sm transition-shadow hover:shadow-lift ${
                        b.clash ? 'z-20 ring-2 ring-bad' : ''
                      } ${b.isPreview ? 'z-30 border-2 border-dashed border-accent bg-accentSoft/90 shadow-md animate-pulse' : ''}`}
                      style={{
                        top: b.top,
                        height: b.height,
                        borderLeftWidth: b.isPreview ? 2 : 3.5,
                        borderColor: b.isPreview ? 'var(--accent)' : `color-mix(in srgb, ${b.color} 35%, transparent)`,
                        borderLeftColor: b.isPreview ? 'var(--accent)' : b.color,
                        background: b.isPreview ? 'var(--accent-soft)' : `color-mix(in srgb, ${b.color} 16%, var(--surface))`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-[11.5px] font-bold text-ink">{b.sec.code}</span>
                        <span
                          className="num shrink-0 rounded-md px-1 py-0.5 text-[9px] font-bold"
                          style={{ background: b.isPreview ? 'var(--accent)' : `color-mix(in srgb, ${b.color} 22%, transparent)`, color: b.isPreview ? '#fff' : 'inherit' }}
                        >
                          {b.isPreview ? `Preview ${b.sec.section}` : b.sec.section}
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course & Section Inspector Modal */}
      <Modal
        open={Boolean(inspectedSec)}
        onClose={() => setInspectedSec(null)}
        title={inspectedSec ? `${inspectedSec.code} · Section ${inspectedSec.section}` : ''}
        sub={inspectedSec?.title}
      >
        {inspectedSec && (
          <div className="flex flex-col gap-4 text-ink">
            {/* Highlights row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-surface2/60 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                  Credits
                </span>
                <div className="num mt-1 text-lg font-extrabold text-accent">
                  {inspectedSec.credit} cr
                </div>
              </div>
              <div className="rounded-xl border border-line bg-surface2/60 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                  Program
                </span>
                <div className="mt-1 text-base font-bold text-ink">
                  {inspectedSec.program || 'BSCSE'}
                </div>
              </div>
              <div className="col-span-2 rounded-xl border border-line bg-surface2/60 p-3 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                  Capacity / Status
                </span>
                <div className="mt-1 text-base font-bold text-ok">
                  Active
                </div>
              </div>
            </div>

            {/* Meetings list */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
                Class Schedule & Venue
              </h4>
              <div className="space-y-2">
                {(inspectedSec.meetings || []).map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface2/40 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-accentSoft px-2.5 py-1 text-xs font-bold text-accent">
                        {m[0]}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <Clock className="h-3.5 w-3.5 text-ink-3" />
                        <span className="num">{fmtTime(m[1])} – {fmtTime(m[2])}</span>
                      </div>
                    </div>
                    {m[3] && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                        <MapPin className="h-3.5 w-3.5 text-accent" />
                        <span className="num font-mono">{m[3]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Faculty Instructors */}
            {inspectedSec.faculty && inspectedSec.faculty.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
                  Faculty Instructors
                </h4>
                <div className="flex flex-wrap gap-2">
                  {inspectedSec.faculty.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl border border-line bg-surface2/50 px-3 py-1.5 text-xs font-semibold text-ink"
                    >
                      <User className="h-3.5 w-3.5 text-ink-3" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
              <Button
                variant="secondary"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={() => handleCopy(`${inspectedSec.code} (${inspectedSec.section})`)}
              >
                {copied ? 'Copied' : 'Copy Course'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setInspectedSec(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
