import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Gauge, Receipt, CalendarRange, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const NAV = [
  { id: 'cgpa', label: 'CGPA', icon: Gauge, desc: 'Grades & standing' },
  { id: 'tuition', label: 'Tuition', icon: Receipt, desc: 'Fees & waivers' },
  { id: 'routine', label: 'Routine', icon: CalendarRange, desc: 'Class schedule' },
];

export default function Sidebar({ active, onChange }) {
  const { theme, toggle } = useTheme();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] flex-col border-r border-line bg-base/80 backdrop-blur-2xl lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <motion.div
          whileHover={{ scale: 1.05, rotate: -4 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-xl bg-gradient-to-br from-accent to-accent2 p-2 shadow-[0_4px_16px_-4px_var(--accent)]"
        >
          <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.4} />
        </motion.div>
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight text-ink">EZ_UIU</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
            Academic Suite
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1.5 px-3">
        {NAV.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive ? 'text-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl border border-line bg-surface2/90 shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <item.icon
                className={`relative z-10 h-[18px] w-[18px] transition-colors ${
                  isActive ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2'
                }`}
                strokeWidth={2.2}
              />
              <span className="relative z-10 flex-1">
                <span className={`block text-[13.5px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
                <span className="block text-[10.5px] text-ink-3">{item.desc}</span>
              </span>
              {isActive && (
                <motion.span
                  layoutId="sidebar-dot"
                  className="relative z-10 h-1.5 w-1.5 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-2 px-3 pb-5">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-3 py-2.5">
          <ShieldCheck className="h-3.5 w-3.5 text-ok" strokeWidth={2.2} />
          <div className="leading-tight">
            <div className="text-[11px] font-semibold text-ink-2">100% on-device</div>
            <div className="text-[10px] text-ink-3">No data ever leaves this device</div>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface/50 px-3 py-2.5 text-ink-2 transition-colors hover:bg-surface2/60 hover:text-ink"
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px] text-warn" strokeWidth={2.2} />
            ) : (
              <Moon className="h-[18px] w-[18px] text-accent" strokeWidth={2.2} />
            )}
          </motion.div>
          <span className="text-[13px] font-medium">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>
        </motion.button>
      </div>
    </aside>
  );
}
