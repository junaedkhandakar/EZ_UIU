import React from 'react';

/**
 * A segmented control: one of N mutually exclusive options.
 *
 * The app had seven hand-rolled segmented groups (target credit load,
 * shuttle direction ×2, submission type, cover template, merge mode, upload
 * mode) — each with its own radius, padding and active colour. They all
 * look like this now.
 *
 * @param {Array<{value, label, icon?}>} options
 * @param {string} value        the currently selected option
 * @param {Function} onChange   called with the newly selected value
 * @param {'sm'|'md'} size
 * @param {boolean} block       stretch to fill the parent width
 */
export default function Segmented({
  options = [],
  value,
  onChange,
  size = 'md',
  block = false,
  className = '',
}) {
  return (
    <div
      role="group"
      className={`inline-flex gap-1 rounded-xl border border-line bg-surface2/60 p-1 ${
        block ? 'w-full' : ''
      } ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors duration-150 ${
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[12px]'
            } ${block ? 'flex-1' : ''} ${
              active
                ? 'border border-line bg-surface text-ink shadow-sm'
                : 'border border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            {opt.icon && <opt.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
