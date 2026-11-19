import React, { useState, useMemo } from 'react';
import CountUp from '../ui/CountUp';
import Surface from '../ui/Surface';
import Chip from '../ui/Chip';
import Badge from '../ui/Badge';
import Input, { Field } from '../ui/Input';
import { type } from '../ui/tokens';
import { calculateAcademicMetrics } from '../../utils/cgpaUtils';
import { Target, CheckCircle2, AlertTriangle, XCircle, Zap } from 'lucide-react';

const PRESETS = [
  { label: '3.00 · Standard', value: 3.0 },
  { label: '3.75 · Cum Laude', value: 3.75 },
  { label: '3.80 · Magna', value: 3.8 },
  { label: '3.90 · Summa', value: 3.9 },
];

const STATUS = {
  ok: { Icon: CheckCircle2, label: 'Achievable', tone: 'ok' },
  ahead: { Icon: Zap, label: 'Ahead of pace', tone: 'accent' },
  hard: { Icon: AlertTriangle, label: 'Ambitious', tone: 'warn' },
  impossible: { Icon: XCircle, label: 'Unreachable', tone: 'bad' },
  done: { Icon: CheckCircle2, label: 'Completed', tone: 'ok' },
};

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
        message: `Unreachable without retakes — straight 4.00s cap you at ${max.toFixed(2)}. Retake low-grade courses to raise the ceiling.`,
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

  const status = STATUS[calc.status] || { Icon: Target, label: '', tone: 'accent' };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Controls */}
      <Surface pad="lg" className="lg:col-span-7">
        <div className="flex items-baseline justify-between">
          <h3 className={type.sectionTitle}>Graduation target</h3>
          <span className="num text-[30px] font-bold leading-none tracking-[-0.02em] text-accent">
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
          aria-label="Target CGPA"
          className="mt-4 w-full cursor-pointer"
        />
        <div className={`num mt-1.5 flex justify-between ${type.eyebrow}`}>
          <span>2.00</span>
          <span>4.00</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Chip
              key={p.value}
              active={Math.abs(target - p.value) < 0.005}
              onClick={() => setTarget(p.value)}
            >
              {p.label}
            </Chip>
          ))}
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <Field
            label="Degree credits required"
            hint="BSCSE / BBA 138 · B. Pharm 165 · BSCSE (old) 140"
          >
            <Input
              type="number"
              value={degreeCredits}
              onChange={(e) => setDegreeCredits(parseFloat(e.target.value) || 138)}
              className="num w-32 font-mono font-semibold"
            />
          </Field>
        </div>
      </Surface>

      {/* Result */}
      <Surface pad="lg" className="lg:col-span-5">
        <h3 className={type.sectionTitle}>Required pace</h3>

        <div className="mt-4 rounded-xl border border-accent/25 bg-accentSoft/60 p-4 text-center">
          <div className={type.eyebrow}>Needed GPA per trimester</div>
          <div className="num mt-2 text-[38px] font-bold leading-none tracking-[-0.02em] text-accent">
            {calc.status === 'impossible' ? (
              '4.00+'
            ) : (
              <CountUp value={Math.max(0, calc.required)} />
            )}
          </div>
          <div className="mt-3">
            <Badge tone={status.tone} icon={status.Icon}>
              {status.label}
            </Badge>
          </div>
        </div>

        <div className="num mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg border border-line bg-surface2/50 p-3">
            <div className={type.eyebrow}>Earned</div>
            <div className="num mt-1 text-[19px] font-bold leading-none text-ink">{earned}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface2/50 p-3">
            <div className={type.eyebrow}>Remaining</div>
            <div className="num mt-1 text-[19px] font-bold leading-none text-ink">{remaining}</div>
          </div>
        </div>

        <p className={`${type.body} mt-4`}>{calc.message}</p>
      </Surface>
    </div>
  );
}

export default TargetPlanner;
