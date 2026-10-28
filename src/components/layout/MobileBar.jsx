import { GraduationCap, Sun, Moon, Gauge, Receipt, CalendarRange } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NAV } from './Sidebar';

export function MobileTopBar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="glass sticky top-0 z-40 flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg bg-gradient-to-br from-accent to-accent2 p-1.5">
          <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-tight text-ink">EZ_UIU</div>
          <div className="text-[9.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
            Academic Suite
          </div>
        </div>
      </div>
      <button
        onClick={toggle}
        className="rounded-xl border border-line bg-surface/70 p-2 text-ink-2 transition-colors hover:text-ink"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
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
              className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-colors ${
                isActive ? 'text-accent' : 'text-ink-3'
              }`}
            >
              <span
                className={`rounded-lg p-1.5 transition-colors ${
                  isActive ? 'bg-accentSoft' : ''
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className={`text-[10.5px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
