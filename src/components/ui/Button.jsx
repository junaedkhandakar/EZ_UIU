import React from 'react';
import { motion } from 'motion/react';

const SIZES = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-lg',
  md: 'h-9.5 px-4 text-[13px] gap-2 rounded-xl py-2',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-xl',
};

const VARIANTS = {
  primary:
    'bg-accent text-white shadow-[0_1px_3px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.22)] hover:brightness-110 active:brightness-95 border border-accent/80',
  secondary:
    'bg-surface2 text-ink border border-line shadow-sm hover:border-line-strong hover:bg-surface2/70',
  ghost: 'text-ink-2 hover:text-ink hover:bg-surface2/70',
  danger: 'bg-bad/10 text-bad border border-bad/25 hover:bg-bad/15',
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className = '',
  disabled = false,
  children,
  onClick,
  ...rest
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45 ${
        SIZES[size]
      } ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={2.2} />}
      {children}
    </motion.button>
  );
}
