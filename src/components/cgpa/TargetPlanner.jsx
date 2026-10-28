import React, { useState, useMemo } from 'react';
import CountUp from '../ui/CountUp';
import { calculateAcademicMetrics } from '../../utils/cgpaUtils';
import { Target, CheckCircle2, AlertTriangle, XCircle, Zap } from 'lucide-react';

const PRESETS = [
  { label: '3.00 · Standard', value: 3.0 },
  { label: '3.75 · Cum Laude', value: 3.75 },
  { label: '3.80 · Magna', value: 3.8 },
  { label: '3.90 · Summa', value: 3.9 },
];

export function TargetPlanner({ courses = [], totalDegreeCredits = 138 }) {
  const [target, setTarget] = useState(3.5);
  const [degreeCredits, setDegreeCredits] = useState(totalDegreeCredits);

  const metrics = useMemo(() => calculateAcademicMetrics(courses), [courses]);
  const earned = metrics.earnedCredits || 0;
  const remaining = Math.max(0, degreeCredits - earned);

  const calc = useMemo(() => {
    if (remaining <= 0) {
      return { required: 0, status: 'done', message: 'All degree credits are complete. You made it.' };
    }
    const needed = target * degreeCredits - metrics.points;
    const required = needed / remaining;

    if (required > 4.0) {
      const max = (metrics.points + remaining * 4.0) / degreeCredits;
      return {
        required,
        status: 'impossible',
        message: `Unreachable without retakes — straight 4.00s caps you at ${max.toFixed(2)}. Retake low-grade courses to raise the ceiling.`,
      };
    }
    if (required >= 3.75) {
      return { required, status: 'hard', message: 'Demanding — needs mostly A / A- across every remaining trimester.' };
    }
    if (required <= metrics.cgpa) {
      return { required, status: 'ahead', message: 'Comfortable — you are already ahead of this pace.' };
    }
    return { required, status: 'ok', message: 'Realistic with consistent performance.' };
  }, [target, degreeCredits, metrics, remaining]);

  const statusStyle = {
    ok: { cls: 'text-ok border-ok/25 bg-ok/10', Icon: CheckCircle2, label: 'Achievable' },
    ahead: { cls: 'text-ok border-ok/25 bg-ok/10', Icon: Zap, label: 'Ahead of pace' },
    hard: { cls: 'text-warn border-warn/25 bg-warn/10', Icon: AlertTriangle, label: 'Ambitious' },
    impossible: { cls: 'text-bad border-bad/25 bg-bad/10', Icon: XCircle, label: 'Unreachable' },
    done: { cls: 'text-ok border-ok/25 bg-ok/10', Icon: CheckCircle2, label: 'Completed' },
  }[calc.status] || { cls: 'text-ink-2 border-line bg-surface2', Icon: Target, label: '' };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Controls */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:col-span-7">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[15px] font-bold tracking-tight text-ink">Graduation target</h3>
          <span className="num text-3xl font-extrabold tracking-tight text-accent">
            {target.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="2"
          max="4"
          step="0.01"
          value={target}
          onChange={(e) => setTarget(parseFloat(e.target.value))}
          className="mt-4 w-full cursor-pointer"
        />
        <div className="num mt-1 flex justify-between text-[10px] font-semibold text-ink-3">
          <span>2.00</span>
          <span>4.00</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setTarget(p.value)}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
                Math.abs(target - p.value) < 0.005
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-surface2/70 text-ink-2 hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">
            Degree credits required
          </label>
          <input
            type="number"
            value={degreeCredits}
            onChange={(e) => setDegreeCredits(parseFloat(e.target.value) || 138)}
            className="num w-32 rounded-xl border border-line bg-surface2/70 px-3.5 py-2.5 font-mono text-[13px] font-semibold text-ink transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <p className="mt-2 text-[10.5px] text-ink-3">
            BSCSE / BBA 138 · B. Pharm 165 · BSCSE (old) 140
          </p>
        </div>
      </div>

      {/* Result */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:col-span-5">
        <h3 className="text-[15px] font-bold tracking-tight text-ink">Required pace</h3>

        <div className="mt-4 rounded-2xl border border-accent/25 bg-accentSoft/40 p-4 text-center">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-accent">
            Needed GPA per trimester
          </div>
          <div className="num mt-1.5 text-[40px] font-extrabold leading-none tracking-tight text-accent">
            {calc.status === 'impossible' ? '4.00+' : <CountUp value={Math.max(0, calc.required)} />}
          </div>
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold ${statusStyle.cls}`}
            >
              <statusStyle.Icon className="h-3 w-3" />
              {statusStyle.label}
            </span>
          </div>
        </div>

        <div className="num mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl border border-line bg-surface2/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              Earned
            </div>
            <div className="mt-1 text-lg font-bold text-ink">{earned}</div>
          </div>
          <div className="rounded-xl border border-line bg-surface2/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              Remaining
            </div>
            <div className="mt-1 text-lg font-bold text-ink">{remaining}</div>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink-2">{calc.message}</p>
      </div>
    </div>
  );
}

export default TargetPlanner;
