import React from 'react';
import { motion } from 'motion/react';

/**
 * The one button in the app.
 *
 * Heights form a single scale that the inputs and selects also use
 * (sm 30 / md 38 / lg 44), so a button sitting next to a field never
 * looks a pixel off.
 *
 * @param {'primary'|'secondary'|'quiet'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'|'icon'} size
 * @param {Function} icon     leading icon component
 */

const SIZES = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-lg',
  md: 'h-[38px] px-4 text-[13px] gap-2 rounded-xl py-2',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-xl',
};

const VARIANTS = {
  primary:
    'bg-gradient-to-b from-accent to-[#4338ca] text-white shadow-[0_1px_3px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.28)] hover:brightness-105 active:brightness-95 border border-accent/80',
  secondary:
    'bg-surface2 text-ink border border-line shadow-sm hover:border-line-strong hover:bg-surface2/80 active:bg-surface2',
  quiet:
    'border border-line bg-surface text-ink-2 shadow-sm hover:border-line-strong hover:text-ink',
  ghost:
    'text-ink-2 hover:text-ink hover:bg-surface2/60',
  danger:
    'bg-bad/10 text-bad border border-bad/25 hover:border-bad/40 hover:bg-bad/15 active:bg-bad/20',
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
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45 ${
        SIZES[size] || SIZES.md
      } ${VARIANTS[variant] || VARIANTS.secondary} ${className}`}
      {...rest}
    >
      {Icon && <Icon className={`${iconSize} shrink-0`} strokeWidth={2.2} />}
      {children}
    </motion.button>
  );
}
