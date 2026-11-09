import React from 'react';
import { GraduationCap, Sun, Moon, Gauge, Receipt, CalendarRange, Search, Sparkles, Bus, FileCheck2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NAV } from './Sidebar';

export function MobileTopBar({ onOpenCommandPalette }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface px-4 py-2.5 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-surface2 border border-line text-ink">
          <GraduationCap className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-bold text-ink">EZ_UIU</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenCommandPalette}
          className="rounded-lg p-1.5 text-ink-3 hover:text-ink hover:bg-surface2 transition-colors"
          aria-label="Open Command Palette"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          id="mobile-theme-toggle"
          aria-label="Toggle theme"
          onClick={toggle}
          className="rounded-lg p-1.5 text-ink-3 hover:text-ink hover:bg-surface2 transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}

export function MobileTabBar({ active, onChange }) {
  const icons = { cgpa: Gauge, advisor: Sparkles, routine: CalendarRange, tuition: Receipt, commute: Bus, coverpage: FileCheck2 };
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-6 p-1">
        {NAV.map((item) => {
          const Icon = icons[item.id];
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] transition-colors ${
                isActive ? 'text-accent font-semibold' : 'text-ink-3'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
