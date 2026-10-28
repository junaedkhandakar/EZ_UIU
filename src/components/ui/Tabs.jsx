import React from 'react';
import { motion } from 'motion/react';

/**
 * Apple-grade sliding pill tab bar driven by Motion's layoutId.
 * Provides interruptible spring animations with zero layout jumps.
 */
export default function Tabs({ tabs, value, onChange, className = '', layoutId = 'active-tab-pill' }) {
  return (
    <div
      role="tablist"
      className={`no-scrollbar relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-line bg-surface2/60 p-1 backdrop-blur-md ${className}`}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={`relative z-10 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            {active && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl border border-line bg-surface shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{ zIndex: -1 }}
              />
            )}
            {t.icon && <t.icon className="h-3.5 w-3.5" strokeWidth={2.2} />}
            <span>{t.label}</span>
            {t.badge != null && (
              <span
                className={`num rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none transition-colors ${
                  active ? 'bg-accentSoft text-accent' : 'bg-surface text-ink-3'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
