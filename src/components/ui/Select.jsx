import React from 'react';
import { control } from './tokens';

/**
 * The one select in the app.
 *
 * Heights match Input and Button: sm 30 / md 34 / lg 40.
 *
 * `className` sizes the wrapper (the select fills it), which is how every
 * call site in the app already uses it.
 *
 * @param {'sm'|'md'|'lg'} size
 */

const SIZES = {
  sm: {
    box: 'h-[30px] rounded-lg text-[12px]',
    pad: 'pl-2.5 pr-7',
    icon: 'right-2 h-3 w-3',
  },
  md: {
    box: 'h-[34px] rounded-lg text-[13px]',
    pad: 'pl-3 pr-8',
    icon: 'right-2.5 h-3.5 w-3.5',
  },
  lg: {
    box: 'h-[40px] rounded-xl text-[13.5px]',
    pad: 'pl-3.5 pr-9',
    icon: 'right-3 h-4 w-4',
  },
};

function Chevron({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

export default function Select({ size = 'md', className = '', children, ...rest }) {
  const s = SIZES[size] || SIZES.md;

  return (
    <div className={`relative ${className}`}>
      <select
        className={`w-full cursor-pointer appearance-none border border-line bg-surface2/60 font-medium text-ink transition-[background-color,border-color,box-shadow] duration-150 hover:border-line-strong hover:bg-surface2/80 ${control.focus} ${s.box} ${s.pad}`}
        {...rest}
      >
        {children}
      </select>
      <Chevron
        className={`pointer-events-none absolute ${s.icon} top-1/2 -translate-y-1/2 text-ink-3`}
      />
    </div>
  );
}

/**
 * A compact select for dense rows and tables.
 */
export function SelectSm({ className = '', children, ...rest }) {
  return (
    <Select size="sm" className={className} {...rest}>
      {children}
    </Select>
  );
}
