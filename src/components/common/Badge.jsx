import React from 'react';

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  icon: Icon,
}) {
  const variants = {
    default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700',
    primary: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wider uppercase',
    sm: 'text-xs px-2.5 py-1 rounded-full font-medium',
    md: 'text-sm px-3 py-1.5 rounded-full font-medium',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 border leading-none ${variants[variant] || variants.default} ${sizes[size] || sizes.sm} ${className}`}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
}
