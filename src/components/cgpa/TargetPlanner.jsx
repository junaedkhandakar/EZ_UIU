import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Target, CheckCircle2, AlertTriangle, XCircle, Info, Sparkles } from 'lucide-react';
import { calculateAcademicMetrics } from '../../utils/cgpaUtils';

export function TargetPlanner({
  courses = [],
  totalDegreeCredits = 138,
}) {
  const [targetCgpa, setTargetCgpa] = useState(3.50);
  const [degreeCredits, setDegreeCredits] = useState(totalDegreeCredits);

  const metrics = useMemo(() => {
    return calculateAcademicMetrics(courses);
  }, [courses]);

  const earnedCredits = metrics.earnedCredits || 0;
  const currentPoints = metrics.points || 0;
  const remainingCredits = Math.max(0, degreeCredits - earnedCredits);

  // Required GPA calculation:
  // Target Total Points = targetCgpa * degreeCredits
  // Required Additional Points = Target Total Points - currentPoints
  // Required GPA = Required Additional Points / remainingCredits
  const calculation = useMemo(() => {
    if (remainingCredits <= 0) {
      return {
        requiredGpa: 0,
        status: 'completed',
        message: 'You have already completed all degree credits!',
      };
    }

    const neededPoints = (targetCgpa * degreeCredits) - currentPoints;
    const requiredGpa = neededPoints / remainingCredits;

    let status = 'achievable';
    let message = 'Realistic target with consistent performance.';

    if (requiredGpa > 4.00) {
      status = 'impossible';
      const maxPossibleCgpa = (currentPoints + (remainingCredits * 4.00)) / degreeCredits;
      message = `Mathematically unachievable without retakes. Maximum achievable CGPA with straight 4.00s is ${maxPossibleCgpa.toFixed(2)}. Consider retaking low-grade courses to boost your ceiling.`;
    } else if (requiredGpa >= 3.75) {
      status = 'hard';
      message = 'Demanding target requiring mostly A/A- grades in all remaining trimesters.';
    } else if (requiredGpa <= metrics.cgpa) {
      status = 'easy';
      message = 'Comfortable target! You are currently ahead of pace.';
    }

    return {
      requiredGpa: Math.max(0, requiredGpa),
      status,
      message,
    };
  }, [targetCgpa, degreeCredits, currentPoints, earnedCredits, remainingCredits, metrics.cgpa]);

  const presetTargets = [
    { label: '3.65 (Cum Laude)', value: 3.65 },
    { label: '3.80 (Magna Cum Laude)', value: 3.80 },
    { label: '3.90 (Summa Cum Laude)', value: 3.90 },
    { label: '3.00 (Standard)', value: 3.00 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Controls Card */}
      <Card>
        <CardHeader
          title="Graduation Target Simulator"
          subtitle="Determine the exact trimester GPA you need to graduate with your desired academic standing"
        />
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target CGPA */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Target Graduation CGPA
                </label>
                <span className="text-base font-extrabold text-apple-blue tabular-nums">
                  {targetCgpa.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="2.00"
                max="4.00"
                step="0.01"
                value={targetCgpa}
                onChange={e => setTargetCgpa(parseFloat(e.target.value))}
                className="w-full accent-apple-blue cursor-pointer"
              />
              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap mt-3">
                {presetTargets.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setTargetCgpa(preset.value)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      Math.abs(targetCgpa - preset.value) < 0.005
                        ? 'bg-apple-blue text-white border-apple-blue font-semibold'
                        : 'bg-black/[0.03] dark:bg-white/[0.05] border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Program Credits */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Total Required Degree Credits
              </label>
              <input
                type="number"
                value={degreeCredits}
                onChange={e => setDegreeCredits(parseFloat(e.target.value) || 138)}
                className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
              />
              <p className="text-[11px] text-zinc-400 mt-2">
                BSCSE/BBA: 138 cr · B. Pharm: 165 cr · BSCSE (Old): 140 cr
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Analysis Result */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Remaining Credits */}
        <Card className="p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Remaining Credits
          </span>
          <div className="mt-2 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {remainingCredits} <span className="text-sm font-normal text-zinc-400">cr</span>
          </div>
          <span className="text-xs text-zinc-500 mt-1">
            {earnedCredits} of {degreeCredits} cr completed ({Math.round((earnedCredits / degreeCredits) * 100)}%)
          </span>
        </Card>

        {/* Required GPA */}
        <Card className={`p-5 flex flex-col justify-between ${
          calculation.status === 'impossible'
            ? 'border-rose-300 bg-rose-50/20 dark:border-rose-900/50'
            : calculation.status === 'hard'
            ? 'border-amber-300 bg-amber-50/20 dark:border-amber-900/50'
            : 'border-emerald-300 bg-emerald-50/20 dark:border-emerald-900/50'
        }`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Average GPA Needed
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tabular-nums ${
              calculation.status === 'impossible'
                ? 'text-rose-600'
                : calculation.status === 'hard'
                ? 'text-amber-600'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {calculation.requiredGpa > 4.00 ? '> 4.00' : calculation.requiredGpa.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-400">per term</span>
          </div>
          <span className="text-xs text-zinc-500 mt-1">
            Across your remaining {remainingCredits} credits
          </span>
        </Card>

        {/* Verdict */}
        <Card className="p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Feasibility
          </span>
          <div className="mt-2 flex items-center gap-2">
            {calculation.status === 'impossible' ? (
              <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
            ) : calculation.status === 'hard' ? (
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            )}
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 capitalize">
              {calculation.status === 'impossible' ? 'Unachievable' : calculation.status === 'hard' ? 'High Effort' : 'On Track'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 leading-snug">
            {calculation.message}
          </p>
        </Card>
      </div>
    </div>
  );
}
