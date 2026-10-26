import React from 'react';
import { Heart, ShieldCheck, GraduationCap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-black/[0.06] dark:border-white/[0.08] mt-20 py-10 bg-white/50 dark:bg-[#121214]/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-apple-blue" />
            <span>
              United International University Student Academic Intelligence Suite · EZ_UIU
            </span>
          </div>

          <div className="flex items-center gap-4 text-center sm:text-right">
            <span>Official UIU grading, tuition, and scheduling algorithms</span>
            <span>·</span>
            <span>Zero server storage · 100% private</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
