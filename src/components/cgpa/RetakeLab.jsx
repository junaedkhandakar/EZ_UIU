import React, { useState, useMemo } from 'react';
import { SelectSm } from '../ui/Select';
import Empty from '../ui/Empty';
import CountUp from '../ui/CountUp';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { type } from '../ui/tokens';
import {
  GRADE_POINTS,
  LETTER_GRADES,
  calculateAcademicMetrics,
} from '../../utils/cgpaUtils';
import { Sparkles, RotateCcw, ArrowRight, ArrowUpRight, Minus, Check } from 'lucide-react';

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

  // AI Retake ROI Analyzer (CGPA gain per Taka spent under UIU 50% waiver rule)
  const roiRanking = useMemo(() => {
    if (!candidates.length || !current.credits) return [];
    return candidates
      .map((c) => {
        const pointDiff = 4.0 - GRADE_POINTS[c.grade];
        const pointGain = pointDiff * c.credit;
        const projectedCgpa = ((current.points || 0) + pointGain) / current.credits;
        const jump = projectedCgpa - current.cgpa;
        const costWithWaiver = c.credit * 6500 * 0.5; // Official UIU 50% waiver
        const roiScore = (jump * 1000) / (costWithWaiver / 1000);
        return {
          ...c,
          pointGain,
          jump: parseFloat(jump.toFixed(2)),
          costWithWaiver,
          roiScore,
        };
      })
      .sort((a, b) => b.roiScore - a.roiScore);
  }, [candidates, current]);

  const toggle = (id, grade) =>
    setSelections((p) => {
      const n = { ...p };
      if (!grade || n[id] === grade) delete n[id];
      else n[id] = grade;
      return n;
    });

  return (
    <div className="flex flex-col gap-4">
      {/* Comparison strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Current CGPA"
          sub={
            <>
              across <span className="num">{current.credits}</span> CGPA credits
            </>
          }
          bodyClassName="num text-[32px] font-bold leading-none tracking-[-0.02em] text-ink"
        >
          <CountUp value={current.cgpa} />
        </StatCard>

        <StatCard
          label="Projected"
          icon={Sparkles}
          tone="accent"
          sub={
            activeCount > 0
              ? `${activeCount} retake${activeCount > 1 ? 's' : ''} simulated`
              : 'Select retakes below to simulate'
          }
          bodyClassName="num text-[32px] font-bold leading-none tracking-[-0.02em] text-accent"
        >
          <CountUp value={simulated.cgpa} />
        </StatCard>

        <StatCard
          label="Impact"
          tone={delta > 0.001 ? 'ok' : 'default'}
          sub={delta > 0.001 ? 'CGPA gain from retakes' : 'no gain yet'}
          bodyClassName={`num flex items-center gap-1.5 text-[32px] font-bold leading-none tracking-[-0.02em] ${
            delta > 0.001 ? 'text-ok' : 'text-ink-3'
          }`}
        >
          {delta > 0.001 ? (
            <ArrowUpRight className="h-6 w-6" strokeWidth={2.4} />
          ) : (
            <Minus className="h-6 w-6" strokeWidth={2.4} />
          )}
          <CountUp value={Math.abs(delta)} />
        </StatCard>
      </div>

      {/* AI Retake ROI & Financial Efficiency Banner */}
      {roiRanking.length > 0 && (
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-accent/30 bg-accentSoft/50 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Highest academic &amp; financial return (UIU 50% waiver)
            </div>
            <p className={`${type.small} mt-1 text-ink-2`}>
              Retaking <b className="text-ink">{roiRanking[0].courseId}</b> (
              {roiRanking[0].courseName}) yields a{' '}
              <b className="num font-bold text-ok">+{roiRanking[0].jump.toFixed(2)} CGPA</b> boost for
              only <b className="num font-bold text-ink">৳{roiRanking[0].costWithWaiver.toLocaleString()}</b>{' '}
              with UIU's 50% discount.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={() =>
              setSelections((prev) => ({
                ...prev,
                [roiRanking[0].id]: 'A',
                ...(roiRanking[1] ? { [roiRanking[1].id]: 'A' } : {}),
              }))
            }
          >
            Select top 2 high-ROI retakes
          </Button>
        </div>
      )}

      {/* Candidate list */}
      {candidates.length === 0 ? (
        <Empty
          title="No retake candidates"
          sub="Nothing eligible here — only F, D, D+, C-, C and C+ grades benefit from a retake under UIU rules."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <p className={type.cardTitle}>
              Retake candidates
              <span className="num ml-2 rounded bg-surface2 px-1.5 py-[2px] text-[10.5px] font-bold text-ink-3">
                {candidates.length}
              </span>
            </p>
            <div className="flex items-center gap-1">
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
                on && (GRADE_POINTS[on] - GRADE_POINTS[c.grade]) * c.credit;
              return (
                <li
                  key={c.id}
                  className={`flex flex-wrap items-center gap-3 px-4 py-2.5 transition-colors ${
                    on ? 'bg-accentSoft/50' : 'hover:bg-surface2/40'
                  }`}
                >
                  {/* toggle */}
                  <button
                    onClick={() => toggle(c.id, 'A')}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-[border-color,background-color] duration-150 ${
                      on ? 'border-accent bg-accent' : 'border-line-strong bg-surface2 hover:border-ink-3'
                    }`}
                    aria-label={`Toggle retake for ${c.courseId}`}
                    aria-pressed={Boolean(on)}
                  >
                    {on && (
                      <svg
                        viewBox="0 0 12 12"
                        className="h-3 w-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2.5 6.5l2.5 2.5 4.5-5.5" />
                      </svg>
                    )}
                  </button>

                  <div className="min-w-[150px] flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{c.courseId}</div>
                    <div className="truncate text-[11px] text-ink-3">
                      {c.courseName} · <span className="num">{c.trimester}</span> ·{' '}
                      <span className="num">{c.credit} cr</span>
                    </div>
                  </div>

                  <Badge tone="bad" className="num">
                    {c.grade}
                  </Badge>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-3" />
                  <SelectSm
                    value={on || ''}
                    onChange={(e) => toggle(c.id, e.target.value)}
                    className="w-[104px]"
                  >
                    <option value="">Target…</option>
                    {LETTER_GRADES.filter((g) => GRADE_POINTS[g] > GRADE_POINTS[c.grade]).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </SelectSm>
                  <span
                    className={`num w-[74px] text-right text-[11px] font-bold ${
                      gained > 0 ? 'text-ok' : 'text-ink-3'
                    }`}
                  >
                    {gained > 0 ? `+${gained.toFixed(0)} pts` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="rounded-xl border border-line bg-surface2/50 px-4 py-3 text-[12px] leading-relaxed text-ink-2">
        <b className="text-ink">UIU retake rule:</b> when you repeat a course, the{' '}
        <i>new grade replaces</i> the old one in CGPA — the old attempt stays on the transcript but is
        excluded from calculation. This simulation mirrors that replacement exactly.
      </p>
    </div>
  );
}

export default RetakeLab;
