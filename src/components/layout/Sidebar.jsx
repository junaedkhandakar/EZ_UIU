import React from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Gauge,
  Receipt,
  CalendarRange,
  Sun,
  Moon,
  Search,
  Compass,
  Bus,
  FileCheck2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const NAV = [
  { id: 'cgpa', label: 'CGPA & Standing', icon: Gauge },
  { id: 'advisor', label: 'AI Advisor', icon: Compass },
  { id: 'routine', label: 'Class Routine', icon: CalendarRange },
  { id: 'tuition', label: 'Tuition & Fees', icon: Receipt },
  { id: 'commute', label: 'Shuttle & Commute', icon: Bus },
  { id: 'coverpage', label: 'Cover Page', icon: FileCheck2 },
];

export default function Sidebar({ active, onChange, onOpenCommandPalette }) {
  const { theme, toggle } = useTheme();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-line bg-surface lg:flex">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
          <GraduationCap className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <div className="leading-none">
          <span className="block text-[13px] font-bold tracking-tight text-ink">EZ_UIU</span>
          <span className="mt-[3px] block text-[10.5px] font-medium text-ink-3">
            Academic Toolkit
          </span>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-3 py-3">
        <button
          onClick={onOpenCommandPalette}
          className="flex w-full items-center justify-between rounded-lg border border-line bg-surface2/60 px-2.5 py-[7px] text-[12px] font-medium text-ink-3 transition-colors hover:border-line-strong hover:bg-surface2 hover:text-ink"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" strokeWidth={2.2} />
            Search…
          </span>
          <span className="kbd-shortcut">⌘K</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-2">
        <span className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3/80">
          Workspace
        </span>
        {NAV.map((item, idx) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex items-center justify-between rounded-lg px-2.5 py-[7px] text-left text-[13px] transition-colors duration-100 ${
                isActive
                  ? 'bg-surface2 font-semibold text-ink'
                  : 'font-medium text-ink-2 hover:bg-surface2/60 hover:text-ink'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent"
                  transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                />
              )}
              <span className="flex min-w-0 items-center gap-2.5">
                <item.icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2'
                  }`}
                  strokeWidth={2}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="kbd-shortcut opacity-0 transition-opacity group-hover:opacity-100">
                {idx + 1}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-line p-2.5">
        <button
          id="sidebar-theme-toggle"
          aria-label="Toggle theme"
          onClick={toggle}
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-surface2 hover:text-ink"
        >
          {theme === 'dark' ? (
            <Sun className="h-3.5 w-3.5 text-ink-3" strokeWidth={2.2} />
          ) : (
            <Moon className="h-3.5 w-3.5 text-ink-3" strokeWidth={2.2} />
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}
