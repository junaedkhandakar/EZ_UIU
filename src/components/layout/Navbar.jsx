import React, { useState } from 'react';
import {
  GraduationCap,
  Calculator,
  Wallet,
  CalendarDays,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function Navbar({ activeTab, setActiveTab }) {
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'cgpa', label: 'CGPA Calculator', icon: Calculator, badge: 'Retake-aware' },
    { id: 'tuition', label: 'Tuition Fee', icon: Wallet, badge: 'Waiver Policy' },
    { id: 'routine', label: 'Routine Builder', icon: CalendarDays, badge: 'Fall 2026' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-black/[0.06] dark:border-white/[0.08] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('cgpa')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-apple-blue to-blue-400 flex items-center justify-center text-white shadow-apple-sm group-hover:scale-105 transition-transform duration-200">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                EZ_UIU
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20 dark:text-blue-300">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-none hidden sm:block">
              UIU Academic Intelligence Suite
            </p>
          </div>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06]">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 apple-button ${
                  isActive
                    ? 'bg-white dark:bg-[#2c2c2e] text-zinc-900 dark:text-zinc-100 shadow-apple-sm font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-apple-blue' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Privacy Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Client-side</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors apple-button"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(prev => !prev)}
            className="md:hidden w-10 h-10 rounded-2xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-black/[0.06] dark:border-white/[0.08] px-4 pt-3 pb-4 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    isActive
                      ? 'bg-apple-blue text-white font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-black/[0.06] dark:bg-white/[0.1] text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
