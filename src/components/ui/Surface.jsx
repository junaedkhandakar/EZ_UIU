import React from 'react';

export default function Surface({
  className = '',
  children,
  ...rest
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}
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
