import React from 'react';

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 select-none apple-button focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/50 disabled:opacity-50 disabled:pointer-events-none';

  const sizeClasses = {
    xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5 font-semibold',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-base rounded-2xl gap-2.5',
    icon: 'p-2 rounded-xl text-sm aspect-square',
  };

  const variantClasses = {
    primary: 'bg-apple-blue text-white hover:bg-apple-blue-hover shadow-sm active:shadow-none',
    secondary: 'bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 border border-black/[0.06] dark:border-white/[0.08]',
    outline: 'bg-transparent border border-black/[0.12] dark:border-white/[0.15] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-zinc-800 dark:text-zinc-200',
    ghost: 'bg-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/15',
    dangerSolid: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.secondary} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}
