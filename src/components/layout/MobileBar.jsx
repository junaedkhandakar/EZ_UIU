import React from 'react';
import { GraduationCap, Sun, Moon, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NAV } from './Sidebar';

export function MobileTopBar({ onOpenCommandPalette }) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
          <GraduationCap className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <span className="text-[13px] font-bold tracking-tight text-ink">EZ_UIU</span>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onOpenCommandPalette}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface2 hover:text-ink"
          aria-label="Open Command Palette"
        >
          <Search className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          id="mobile-theme-toggle"
          aria-label="Toggle theme"
          onClick={toggle}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface2 hover:text-ink"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
        </button>
      </div>
    </header>
  );
}

export function MobileTabBar({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-6 px-1.5 py-1.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] transition-colors ${
                isActive ? 'font-semibold text-accent' : 'font-medium text-ink-3'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.3 : 1.9} />
              <span className="leading-none">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
