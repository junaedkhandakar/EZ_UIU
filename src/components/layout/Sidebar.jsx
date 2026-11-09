import React from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Gauge,
  Receipt,
  CalendarRange,
  ShieldCheck,
  Sun,
  Moon,
  Search,
  Sparkles,
  Bus,
  Sparkle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const NAV_GROUPS = [
  {
    category: 'ACADEMIC INTELLIGENCE',
    items: [
      { id: 'cgpa', label: 'CGPA & Honors', icon: Gauge, desc: 'Standing, recovery & ROI' },
      { id: 'advisor', label: 'AI Academic Advisor', icon: Sparkles, desc: 'Prereqs & RAG Copilot', badge: 'RAG' },
      { id: 'routine', label: 'Routine Builder', icon: CalendarRange, desc: 'UCAM clash solver' },
    ],
  },
  {
    category: 'CAMPUS LOGISTICS',
    items: [
      { id: 'tuition', label: 'Tuition & Waivers', icon: Receipt, desc: 'Fees, discounts & receipts' },
      { id: 'commute', label: 'Campus Commute', icon: Bus, desc: 'Shuttles & 6 AC routes', live: true },
    ],
  },
];

export const NAV = NAV_GROUPS.flatMap((g) => g.items);

export default function Sidebar({ active, onChange, onOpenCommandPalette }) {
  const { theme, toggle } = useTheme();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[246px] flex-col border-r border-line bg-surface/75 backdrop-blur-2xl lg:flex selection:bg-accent selection:text-white">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 pb-4 pt-5 border-b border-line/60">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -3 }}
            whileTap={{ scale: 0.96 }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-accent2 to-[#4338ca] shadow-[0_4px_16px_-4px_var(--accent)] border border-white/20"
          >
            <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.4} />
          </motion.div>
          <div className="leading-tight">
            <div className="text-[15px] font-extrabold tracking-tight text-ink flex items-center gap-1.5">
              EZ_UIU
              <span className="rounded-full bg-accentSoft text-accent border border-accent/20 px-1.5 py-0.5 text-[9px] font-bold">
                PRO
              </span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              Student OS
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search Spotlight Button */}
      <div className="px-3 py-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenCommandPalette}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-surface2/60 px-3 py-2 text-xs font-medium text-ink-3 transition-colors hover:border-line-strong hover:bg-surface2 hover:text-ink shadow-sm group"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-accent transition-transform group-hover:scale-110" />
            <span className="font-medium">Search anything…</span>
          </div>
          <span className="kbd-shortcut font-mono font-bold">⌘K</span>
        </motion.button>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-1 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.category} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3/80">
              {group.category}
            </div>

            {group.items.map((item) => {
              const isActive = item.id === active;
              return (
                <button
                  key={item.id}
                  onClick={() => onChange(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive ? 'text-ink font-semibold' : 'text-ink-2 hover:text-ink hover:bg-surface2/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-xl border border-line bg-surface2/90 shadow-sm"
                      style={{
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 var(--border-specular)',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}

                  <item.icon
                    className={`relative z-10 h-[17px] w-[17px] shrink-0 transition-colors ${
                      isActive ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2'
                    }`}
                    strokeWidth={2.2}
                  />

                  <div className="relative z-10 min-w-0 flex-1 leading-tight">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[13px]">{item.label}</span>
                      {item.badge && (
                        <span className="rounded bg-accentSoft text-accent border border-accent/25 px-1.5 py-0.5 text-[8.5px] font-bold">
                          {item.badge}
                        </span>
                      )}
                      {item.live && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-ok opacity-75 live-dot" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
                        </span>
                      )}
                    </div>
                    <span className="block truncate text-[10.5px] text-ink-3 font-normal mt-0.5">
                      {item.desc}
                    </span>
                  </div>

                  {isActive && (
                    <motion.span
                      layoutId="sidebar-leading-indicator"
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-line/60 px-3 pb-4 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-line/60 bg-surface2/40 px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5 text-ok shrink-0" strokeWidth={2.2} />
          <div className="leading-tight">
            <div className="text-[10.5px] font-bold text-ink">100% On-Device Storage</div>
            <div className="text-[9.5px] text-ink-3">Private & secure in your browser</div>
          </div>
        </div>

        <motion.button
          id="sidebar-theme-toggle"
          aria-label="Toggle theme"
          whileTap={{ scale: 0.96 }}
          onClick={toggle}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-surface2 hover:text-ink shadow-sm"
        >
          <div className="flex items-center gap-2">
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-warn" strokeWidth={2.2} />
              ) : (
                <Moon className="h-4 w-4 text-accent" strokeWidth={2.2} />
              )}
            </motion.div>
            <span>{theme === 'dark' ? 'Light Appearance' : 'Dark Appearance'}</span>
          </div>
          <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[10px] text-ink-3">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </motion.button>
      </div>
    </aside>
  );
}
