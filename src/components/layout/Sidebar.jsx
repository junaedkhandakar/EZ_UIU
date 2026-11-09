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
  Sparkles,
  Bus,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const NAV = [
  { id: 'cgpa', label: 'CGPA & Standing', icon: Gauge },
  { id: 'advisor', label: 'AI Advisor', icon: Sparkles },
  { id: 'routine', label: 'Routine Builder', icon: CalendarRange },
  { id: 'tuition', label: 'Tuition & Fees', icon: Receipt },
  { id: 'commute', label: 'Shuttle & Commute', icon: Bus },
];

export default function Sidebar({ active, onChange, onOpenCommandPalette }) {
  const { theme, toggle } = useTheme();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-line bg-surface lg:flex">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface2 border border-line text-ink">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="leading-none">
            <span className="text-[13px] font-bold text-ink">EZ_UIU</span>
            <span className="block text-[10.5px] text-ink-3 mt-0.5">Academic Toolkit</span>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-3 py-2.5">
        <button
          onClick={onOpenCommandPalette}
          className="flex w-full items-center justify-between rounded-lg border border-line bg-surface2/50 px-2.5 py-1.5 text-xs text-ink-3 hover:text-ink hover:border-line-strong transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>Search…</span>
          </div>
          <span className="kbd-shortcut font-mono">⌘K</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-1">
        {NAV.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors duration-100 ${
                isActive
                  ? 'bg-surface2 text-ink font-semibold'
                  : 'text-ink-2 hover:bg-surface2/60 hover:text-ink font-medium'
              }`}
            >
              <item.icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-accent' : 'text-ink-3'
                }`}
                strokeWidth={2}
              />
              <span className="truncate">{item.label}</span>
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
          className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-ink-2 hover:bg-surface2 hover:text-ink transition-colors"
        >
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5 text-ink-3" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-ink-3" />
            )}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
