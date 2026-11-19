import React from 'react';

/**
 * A toggle chip: a small pill that switches a filter, a preset or a mode on
 * and off.
 *
 * The app had roughly fifteen hand-written copies of this button, each with
 * its own padding, radius and active colours. They are all here now.
 *
 * @param {boolean} active     whether the chip is the current selection
 * @param {'accent'|'solid'|'ok'|'bad'|'neutral'} tone  the accent used when active
 */

const ACTIVE = {
  accent: 'border-accent bg-accentSoft text-accent',
  solid: 'border-accent bg-accent text-white',
  ok: 'border-ok/40 bg-ok/10 text-ok',
  bad: 'border-bad/40 bg-bad/10 text-bad',
  neutral: 'border-line-strong bg-surface2 text-ink',
};

const INACTIVE =
  'border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink';

const SIZES = {
  sm: 'h-[26px] gap-1 rounded-lg px-2 text-[11px]',
  md: 'h-[30px] gap-1.5 rounded-lg px-2.5 text-[12px]',
};

export default function Chip({
  active = false,
  tone = 'accent',
  size = 'md',
  icon: Icon,
  onRemove,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex items-center whitespace-nowrap border font-semibold transition-[background-color,border-color,color] duration-150 ${
        SIZES[size] || SIZES.md
      } ${active ? ACTIVE[tone] || ACTIVE.accent : INACTIVE} ${className}`}
      {...rest}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />}
      {children}
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              onRemove();
            }
          }}
          aria-label="Remove"
          className="-mr-0.5 rounded p-0.5 text-ink-3 transition-colors hover:text-bad"
        >
          <svg
            viewBox="0 0 12 12"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </span>
      )}
    </button>
  );
}
