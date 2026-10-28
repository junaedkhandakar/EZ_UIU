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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] flex-col border-r border-line bg-base/70 backdrop-blur-xl lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <div className="rounded-xl bg-gradient-to-br from-accent to-accent2 p-2 shadow-[0_4px_16px_-4px_var(--accent)]">
          <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight text-ink">EZ_UIU</div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
            Academic Suite
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                isActive ? 'bg-surface2 text-ink' : 'text-ink-2 hover:bg-surface2/60 hover:text-ink'
              }`}
            >
              <item.icon
                className={`h-[18px] w-[18px] ${isActive ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2'}`}
                strokeWidth={2.2}
              />
              <span className="flex-1">
                <span className={`block text-[13.5px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
                <span className="block text-[10.5px] text-ink-3">{item.desc}</span>
              </span>
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
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
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-ink-2 transition-colors hover:bg-surface2/60 hover:text-ink"
        >
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px] text-ink-3" strokeWidth={2.2} />
          ) : (
            <Moon className="h-[18px] w-[18px] text-ink-3" strokeWidth={2.2} />
          )}
          <span className="text-[13px] font-medium">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>
        </button>
      </div>
    </aside>
  );
}
