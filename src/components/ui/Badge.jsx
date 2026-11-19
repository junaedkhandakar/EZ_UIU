import React from 'react';

/**
 * A small inline pill: counts, categories, statuses.
 *
 * Replaces the ~40 hand-written `rounded-full px-2.5 py-0.5 text-xs` spans
 * that had drifted into four different shapes.
 *
 * @param {'accent'|'ok'|'warn'|'bad'|'neutral'|'quiet'} tone
 */

const TONES = {
  accent: 'border-accent/25 bg-accentSoft text-accent',
  ok: 'border-ok/25 bg-ok/10 text-ok',
  warn: 'border-warn/25 bg-warn/10 text-warn',
  bad: 'border-bad/25 bg-bad/10 text-bad',
  neutral: 'border-line bg-surface2 text-ink-2',
  quiet: 'border-line bg-surface2/50 text-ink-3',
};

export default function Badge({
  tone = 'neutral',
  icon: Icon,
  className = '',
  children,
  ...rest
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-[3px] text-[10.5px] font-semibold leading-none ${
        TONES[tone] || TONES.neutral
      } ${className}`}
      {...rest}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" strokeWidth={2.4} />}
      {children}
    </span>
  );
}
