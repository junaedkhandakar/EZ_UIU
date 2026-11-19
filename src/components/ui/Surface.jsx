import React from 'react';
import { type } from './tokens';

/**
 * The one card component in the app.
 *
 * Previously every panel re-declared `rounded-xl border border-line
 * bg-surface p-4 sm:p-5` and then overrode the padding again — which made
 * the effective padding depend on CSS source order rather than intent.
 * Padding is now an explicit prop.
 *
 * @param {'none'|'sm'|'md'|'lg'} pad
 * @param {boolean} hover       lift the card slightly on hover
 * @param {'default'|'accent'|'inset'} tone
 */

const PADS = {
  none: '',
  sm: 'p-3.5',
  md: 'p-4',
  lg: 'p-5',
};

const TONES = {
  default: 'border-line bg-surface',
  accent: 'border-accent/30 bg-accentSoft/40',
  inset: 'border-line bg-surface2/40',
};

export default function Surface({
  pad = 'md',
  hover = false,
  tone = 'default',
  className = '',
  children,
  ...rest
}) {
  return (
    <div
      className={`rounded-xl border shadow-card transition-[box-shadow,border-color,transform] duration-150 ${
        TONES[tone] || TONES.default
      } ${PADS[pad] ?? PADS.md} ${
        hover ? 'hover:-translate-y-px hover:border-line-strong hover:shadow-lift' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * A panel header: title, optional sub-line, optional right-hand actions.
 * The divider is part of the component so every panel breaks the same way.
 */
export function SurfaceHeader({ title, sub, right, className = '', titleClassName = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 pb-3 ${className}`}>
      <div className="min-w-0">
        <h3 className={`${type.sectionTitle} ${titleClassName}`}>{title}</h3>
        {sub && <p className={`${type.small} mt-0.5`}>{sub}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}
