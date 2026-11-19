import React from 'react';
import { type } from './tokens';

/**
 * A metric card that can host an arbitrary readout (chart, count-up number,
 * inline element) rather than a plain string.
 *
 * Used where the value is more than text: the CGPA gauge, the target
 * planner's required pace, the advisor's per-trimester KPIs.
 *
 * @param {'default'|'accent'|'ok'|'warn'|'bad'} tone
 */
export default function StatCard({
  label,
  children,
  sub,
  tone = 'default',
  icon: Icon,
  className = '',
  bodyClassName = '',
}) {
  const toneStyles = {
    default: 'border-line bg-surface',
    accent: 'border-accent/30 bg-accentSoft/40',
    ok: 'border-ok/25 bg-ok/[0.07]',
    warn: 'border-warn/25 bg-warn/[0.07]',
    bad: 'border-bad/25 bg-bad/[0.07]',
  };
  const labelTone = {
    default: 'text-ink-3',
    accent: 'text-accent',
    ok: 'text-ok',
    warn: 'text-warn',
    bad: 'text-bad',
  };

  return (
    <div
      className={`rounded-xl border p-4 shadow-card ${
        toneStyles[tone] || toneStyles.default
      } ${className}`}
    >
      <div className={`flex items-center gap-1.5 ${type.eyebrow} ${labelTone[tone] || labelTone.default}`}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />}
        {label}
      </div>
      <div className={`mt-2 ${bodyClassName}`}>{children}</div>
      {sub && <div className={`${type.micro} mt-1.5`}>{sub}</div>}
    </div>
  );
}
