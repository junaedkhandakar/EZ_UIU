import React, { useState, useMemo } from 'react';
import Button from '../ui/Button';
import { SelectSm } from '../ui/Select';
import Empty from '../ui/Empty';
import CountUp from '../ui/CountUp';
import {
  GRADE_POINTS,
  LETTER_GRADES,
  calculateAcademicMetrics,
} from '../../utils/cgpaUtils';
import { Sparkles, RotateCcw, ArrowRight, ArrowUpRight, Minus } from 'lucide-react';

const ELIGIBLE = ['F', 'D', 'D+', 'C-', 'C', 'C+'];

export function RetakeLab({ courses = [], effectiveCourses = [] }) {
  const [selections, setSelections] = useState({});

  const candidates = useMemo(
    () => effectiveCourses.filter((c) => ELIGIBLE.includes(c.grade)),
    [effectiveCourses]
  );

  const current = useMemo(() => calculateAcademicMetrics(courses), [courses]);

  const simulated = useMemo(() => {
    if (!Object.keys(selections).length) return current;
    const list = courses.map((c) =>
      selections[c.id] ? { ...c, grade: selections[c.id] } : c
    );
    return calculateAcademicMetrics(list);
  }, [courses, selections, current]);

  const delta = simulated.cgpa - current.cgpa;
  const activeCount = Object.keys(selections).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Comparison strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-3">
            Current CGPA
          </div>
          <div className="num mt-2 text-[32px] font-bold leading-none tracking-tight text-ink">
            <CountUp value={current.cgpa} />
          </div>
          <div className="mt-1.5 text-xs text-ink-3">
            across <span className="num">{current.credits}</span> CGPA credits
          </div>
        </div>

        <div className="relative rounded-2xl border border-accent/30 bg-accentSoft/40 p-5 shadow-card">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-accent">
            <Sparkles className="h-3 w-3" />
            Projected
          </div>
          <div className="num mt-2 text-[32px] font-bold leading-none tracking-tight text-accent">
            <CountUp value={simulated.cgpa} />
          </div>
          <div className="mt-1.5 text-xs text-ink-2">
            {activeCount > 0
              ? `${activeCount} retake${activeCount > 1 ? 's' : ''} simulated`
              : 'Select retakes below to simulate'}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-3">
            Impact
          </div>
          <div
            className={`num mt-2 flex items-center gap-1.5 text-[32px] font-bold leading-none tracking-tight ${
              delta > 0.001 ? 'text-ok' : delta < -0.001 ? 'text-bad' : 'text-ink-3'
            }`}
          >
            {delta > 0.001 ? (
              <ArrowUpRight className="h-6 w-6" strokeWidth={2.4} />
            ) : (
              <Minus className="h-6 w-6" strokeWidth={2.4} />
            )}
            <CountUp value={Math.abs(delta)} />
          </div>
          <div className="mt-1.5 text-xs text-ink-3">
            {delta > 0.001 ? 'CGPA gain from retakes' : 'no gain yet'}
          </div>
        </div>
      </div>

      {/* Candidate list */}
      {candidates.length === 0 ? (
        <Empty
          title="No retake candidates"
          sub="Nothing eligible here — only F, D, D+, C-, C and C+ grades benefit from a retake under UIU rules."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-[13px] font-bold text-ink">
              Retake candidates
              <span className="num ml-2 rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink-3">
                {candidates.length}
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSelections(Object.fromEntries(candidates.map((c) => [c.id, 'A'])))
                }
              >
                All → A
              </Button>
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setSelections({})}>
                Reset
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-line/60">
            {candidates.map((c) => {
              const on = selections[c.id];
              const gained =
                on &&
                (GRADE_POINTS[on] - GRADE_POINTS[c.grade]) * c.credit;
              return (
                <li
                  key={c.id}
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 transition-colors ${
                    on ? 'bg-accentSoft/30' : 'hover:bg-surface2/40'
                  }`}
                >
                  {/* toggle */}
                  <button
                    onClick={() =>
                      setSelections((p) => {
                        const n = { ...p };
                        if (n[c.id]) delete n[c.id];
                        else n[c.id] = 'A';
                        return n;
                      })
                    }
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all active:scale-90 ${
                      on ? 'border-accent bg-accent' : 'border-line-strong bg-surface2 hover:border-ink-3'
                    }`}
                    aria-label={`Toggle retake for ${c.courseId}`}
                  >
                    {on && (
                      <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 6.5l2.5 2.5 4.5-5.5" />
                      </svg>
                    )}
                  </button>

                  <div className="min-w-[150px] flex-1">
                    <div className="truncate text-[13px] font-bold text-ink">{c.courseId}</div>
                    <div className="truncate text-[11px] text-ink-3">
                      {c.courseName} · <span className="num">{c.trimester}</span> ·{' '}
                      <span className="num">{c.credit} cr</span>
                    </div>
                  </div>

                  <span className="num rounded-lg border border-bad/25 bg-bad/10 px-2 py-1 text-[11px] font-bold text-bad">
                    {c.grade}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-3" />
                  <SelectSm
                    value={on || ''}
                    onChange={(e) =>
                      setSelections((p) => {
                        const n = { ...p };
                        if (e.target.value) n[c.id] = e.target.value;
                        else delete n[c.id];
                        return n;
                      })
                    }
                    className="w-[92px]"
                  >
                    <option value="">Target…</option>
                    {LETTER_GRADES.filter((g) => GRADE_POINTS[g] > GRADE_POINTS[c.grade]).map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      )
                    )}
                  </SelectSm>
                  <span
                    className={`num w-[74px] text-right text-[11px] font-bold ${
                      gained > 0 ? 'text-ok' : 'text-ink-3'
                    }`}
                  >
                    {gained > 0 ? `+${(GRADE_POINTS[on] - GRADE_POINTS[c.grade]) * c.credit} pts` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="rounded-2xl border border-line bg-surface2/50 px-4 py-3 text-xs leading-relaxed text-ink-2">
        <b className="text-ink">UIU retake rule:</b> when you repeat a course, the <i>new grade
        replaces</i> the old one in CGPA — the old attempt stays on the transcript but is excluded
        from calculation. This simulation mirrors that replacement exactly.
      </p>
    </div>
  );
}

export default RetakeLab;
