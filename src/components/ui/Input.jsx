import React from 'react';
import { X } from 'lucide-react';
import { type, control } from './tokens';

/**
 * The one text input in the app.
 *
 * The app had roughly thirty hand-written <input> elements, each with its own
 * height, padding, radius and focus treatment. They are all here now.
 *
 * Heights match Button: sm 30 / md 38 / lg 44.
 *
 * @param {'sm'|'md'|'lg'} size
 * @param {Function} icon     leading icon component
 * @param {Function} onClear  when provided, a clear button is rendered
 */

const SIZES = {
  sm: {
    box: 'h-[30px] rounded-lg text-[12px]',
    plain: 'pl-2.5 pr-2.5',
    iconOnly: 'pl-[30px] pr-2.5',
    clearOnly: 'pl-2.5 pr-[26px]',
    iconAndClear: 'pl-[30px] pr-[26px]',
    icon: 'left-2.5 h-3.5 w-3.5',
  },
  md: {
    box: 'h-[38px] rounded-xl text-[13px]',
    plain: 'pl-3 pr-3',
    iconOnly: 'pl-[32px] pr-3',
    clearOnly: 'pl-3 pr-[30px]',
    iconAndClear: 'pl-[32px] pr-[30px]',
    icon: 'left-2.5 h-4 w-4',
  },
  lg: {
    box: 'h-11 rounded-xl text-sm',
    plain: 'pl-4 pr-4',
    iconOnly: 'pl-[34px] pr-4',
    clearOnly: 'pl-4 pr-[30px]',
    iconAndClear: 'pl-[34px] pr-[30px]',
    icon: 'left-3 h-4 w-4',
  },
};

export default function Input({
  size = 'md',
  icon: Icon,
  onClear,
  className = '',
  wrapperClassName = '',
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const hasIcon = Boolean(Icon);
  const hasClear = Boolean(onClear);

  const padding = hasIcon ? (hasClear ? s.iconAndClear : s.iconOnly) : hasClear ? s.clearOnly : s.plain;

  return (
    <div className={`relative ${wrapperClassName}`}>
      {hasIcon && (
        <Icon
          className={`pointer-events-none absolute ${s.icon} top-1/2 -translate-y-1/2 text-ink-3`}
          strokeWidth={2}
        />
      )}
      <input
        className={`w-full border border-line bg-surface2/70 font-medium text-ink placeholder-ink-3 transition-colors duration-150 hover:border-line-strong hover:bg-surface2/80 ${control.focus} ${s.box} ${padding} ${className}`}
        {...rest}
      />
      {hasClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-3 transition-colors hover:bg-surface2 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * A labelled form field. Renders the label above and optional helper text
 * below, so every form in the app labels things the same way.
 */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  className = '',
  labelClassName = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className={`${type.label} mb-1.5 block ${labelClassName}`}>
          {label}
        </label>
      )}
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-ink-3">{hint}</p>}
    </div>
  );
}

/**
 * A multi-line text area with the same visual language as Input.
 */
export function Textarea({ className = '', ...rest }) {
  return (
    <textarea
      className={`w-full resize-none rounded-xl border border-line bg-surface2/70 px-3 py-2.5 text-[13px] leading-relaxed text-ink placeholder-ink-3 transition-colors duration-150 hover:border-line-strong hover:bg-surface2/80 ${control.focus} ${className}`}
      {...rest}
    />
  );
}
