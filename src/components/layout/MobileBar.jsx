import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Sun, Moon, Gauge, Receipt, CalendarRange } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NAV } from './Sidebar';

export function MobileTopBar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="glass sticky top-0 z-40 flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2.5">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg bg-gradient-to-br from-accent to-accent2 p-1.5 shadow-[0_2px_8px_-2px_var(--accent)]"
        >
          <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.4} />
        </motion.div>
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-tight text-ink">EZ_UIU</div>
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-accent">
            Academic Suite
          </div>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={toggle}
        className="rounded-xl border border-line bg-surface/70 p-2 text-ink-2 transition-colors hover:text-ink"
        aria-label="Toggle theme"
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-warn" /> : <Moon className="h-4 w-4 text-accent" />}
        </motion.div>
      </motion.button>
    </header>
  );
}

export function MobileTabBar({ active, onChange }) {
  const icons = { cgpa: Gauge, tuition: Receipt, routine: CalendarRange };
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1 p-2">
        {NAV.map((item) => {
          const Icon = icons[item.id];
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`relative flex flex-col items-center gap-1 rounded-xl py-2 transition-colors ${
                isActive ? 'text-accent' : 'text-ink-3'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute inset-0 rounded-xl bg-accentSoft"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 p-1">
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className={`relative z-10 text-[10.5px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
