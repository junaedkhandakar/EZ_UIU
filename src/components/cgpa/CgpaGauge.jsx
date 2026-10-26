import React from 'react';
import { Award, AlertTriangle, Sparkles } from 'lucide-react';
import { getHonorsStanding } from '../../utils/cgpaUtils';

export function CgpaGauge({ cgpa = 0, earnedCredits = 0, minRequired = 138 }) {
  const honors = getHonorsStanding(cgpa, earnedCredits, minRequired);
  
  // Circumference for r=54
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29
  const progressRatio = Math.min(1, Math.max(0, cgpa / 4.00));
  const strokeDashoffset = circumference * (1 - progressRatio);

  let strokeColor = '#0071e3'; // Apple Blue
  if (cgpa >= 3.90) strokeColor = '#af52de'; // Purple
  else if (cgpa >= 3.80) strokeColor = '#0071e3'; // Blue
  else if (cgpa >= 3.65) strokeColor = '#34c759'; // Emerald Green
  else if (cgpa < 2.00 && earnedCredits > 0) strokeColor = '#ff3b30'; // Red

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: strokeColor }}
      />

      <div className="relative w-36 h-36 flex items-center justify-center my-2">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
          {/* Track Circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-black/[0.06] dark:stroke-white/[0.08]"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={strokeColor}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-3xl font-extrabold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
            {cgpa.toFixed(2)}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
            out of 4.00
          </span>
        </div>
      </div>

      {/* Honors / Standing Pill */}
      <div className="mt-3 text-center">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${honors.badgeColor} shadow-sm transition-all duration-200`}>
          {cgpa < 2.00 && earnedCredits > 0 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          ) : (
            <Award className="w-3.5 h-3.5" />
          )}
          <span>{honors.tier}</span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-[200px]">
          {honors.description}
        </p>
      </div>
    </div>
  );
}
