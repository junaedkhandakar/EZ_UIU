import React from 'react';

/**
 * The one surface in the app.
 *
 * @param {'default'|'accent'} tone
 * @param {boolean} hover    lift the card on hover
 * @param {'sm'|'md'|'lg'} pad   inner padding scale
 */
export default function Surface({
  tone = 'default',
  hover = false,
  pad = 'md',
  className = '',
  children,
  ...rest
}) {
  const tones = {
    default: 'border-line bg-surface',
    accent: 'border-accent/25 bg-accentSoft',
  };
  const pads = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  };

  return (
    <div
      className={`rounded-xl border shadow-card ${
        tones[tone] || tones.default
      } ${pads[pad] || pads.md} ${hover ? 'transition-shadow hover:shadow-lift' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SurfaceHeader({ title, sub, right, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 pb-3 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-ink-3">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
