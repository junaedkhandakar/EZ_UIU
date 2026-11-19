import React from 'react';
import { motion } from 'motion/react';

/**
 * The one button in the app.
 *
 * Heights form a single scale that the inputs and selects also use
 * (sm 30 / md 34 / lg 40), so a button sitting next to a field never
 * looks a pixel off.
 *
 * @param {'primary'|'secondary'|'ghost'|'quiet'|'danger'} variant
 * @param {'sm'|'md'|'lg'|'icon'} size
 * @param {Function} icon     leading icon component
 */

const SIZES = {
  sm: 'h-[30px] gap-1.5 rounded-lg px-2.5 text-[12px]',
  md: 'h-[34px] gap-1.5 rounded-lg px-3.5 text-[13px]',
  lg: 'h-[40px] gap-2 rounded-xl px-4 text-[13.5px]',
  icon: 'h-[30px] w-[30px] rounded-lg',
};

const VARIANTS = {
  primary:
    'border border-transparent bg-gradient-to-b from-accent to-accent2 text-white shadow-[0_1px_2px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.22)] hover:brightness-[1.08] active:brightness-95',
  secondary:
    'border border-line bg-surface text-ink shadow-sm hover:border-line-strong hover:bg-surface2/60 active:bg-surface2',
  quiet:
    'border border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
  ghost:
    'border border-transparent text-ink-2 hover:bg-surface2/70 hover:text-ink',
  danger:
    'border border-bad/25 bg-bad/10 text-bad hover:border-bad/40 hover:bg-bad/15 active:bg-bad/20',
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  type = 'button',
  className = '',
  disabled = false,
  children,
  onClick,
  ...rest
}) {
  const iconSize = size === 'sm' || size === 'icon' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <motion.button
      type={type}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-[background-color,border-color,color,filter] duration-150 disabled:pointer-events-none disabled:opacity-45 ${
        SIZES[size] || SIZES.md
      } ${VARIANTS[variant] || VARIANTS.secondary} ${className}`}
      {...rest}
    >
      {Icon && <Icon className={`${iconSize} shrink-0`} strokeWidth={2.2} />}
      {children}
    </motion.button>
  );
}
