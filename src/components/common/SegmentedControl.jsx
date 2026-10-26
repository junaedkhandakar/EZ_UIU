import React from 'react';

export function SegmentedControl({
  options = [],
  value,
  onChange,
  className = '',
  size = 'md',
}) {
  const sizeClasses = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-xs sm:text-sm',
    lg: 'p-1.5 text-sm sm:text-base',
  };

  const buttonPad = {
    sm: 'py-1 px-2.5',
    md: 'py-1.5 px-3.5',
    lg: 'py-2 px-5',
  };

  return (
    <div className={`inline-flex items-center rounded-xl bg-black/[0.06] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      {options.map(opt => {
        const isActive = value === opt.value;
        const Icon = opt.icon;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 select-none ${buttonPad[size] || buttonPad.md} ${
              isActive
                ? 'bg-white dark:bg-[#2c2c2e] text-zinc-900 dark:text-zinc-100 shadow-apple-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive
                  ? 'bg-apple-blue/15 text-apple-blue dark:bg-apple-blue/30 dark:text-blue-300'
                  : 'bg-black/[0.07] dark:bg-white/[0.1] text-zinc-600 dark:text-zinc-400'
              }`}>
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
