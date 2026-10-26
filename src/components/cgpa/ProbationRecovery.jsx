import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { ShieldAlert, ShieldCheck, AlertCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { calculateAcademicMetrics } from '../../utils/cgpaUtils';

export function ProbationRecovery({ courses = [], minCgpa = 2.00, dept = 'regular' }) {
  const metrics = useMemo(() => {
    return calculateAcademicMetrics(courses);
  }, [courses]);

  const isOnProbation = metrics.cgpa < minCgpa && metrics.credits > 0;
  const currentCgpa = metrics.cgpa;
  const currentCredits = metrics.credits;
  const currentPoints = metrics.points;

  // Recovery Scenarios:
  // How many credits at 3.00, 3.33, 3.67, 4.00 are needed to reach minCgpa?
  // New CGPA = (currentPoints + newCredits * scenarioGpa) / (currentCredits + newCredits) >= minCgpa
  // currentPoints + newCredits * scenarioGpa >= minCgpa * currentCredits + minCgpa * newCredits
  // newCredits * (scenarioGpa - minCgpa) >= minCgpa * currentCredits - currentPoints
  // newCredits >= (minCgpa * currentCredits - currentPoints) / (scenarioGpa - minCgpa)
  const scenarios = useMemo(() => {
    if (!isOnProbation) return [];

    const deficitPoints = (minCgpa * currentCredits) - currentPoints;
    const targets = [
      { gpa: 4.00, label: 'Straight A (4.00 GPA)' },
      { gpa: 3.67, label: 'A- Average (3.67 GPA)' },
      { gpa: 3.33, label: 'B+ Average (3.33 GPA)' },
      { gpa: 3.00, label: 'B Average (3.00 GPA)' },
    ];

    return targets.map(t => {
      const netGainPerCredit = t.gpa - minCgpa;
      if (netGainPerCredit <= 0) {
        return { ...t, creditsNeeded: Infinity, terms: Infinity };
      }
      const creditsNeeded = Math.ceil(deficitPoints / netGainPerCredit);
      const terms = Math.ceil(creditsNeeded / 12);
      return {
        ...t,
        creditsNeeded,
        terms,
      };
    });
  }, [isOnProbation, minCgpa, currentCredits, currentPoints]);

  if (!isOnProbation) {
    return (
      <Card className="p-8 text-center bg-emerald-500/[0.03] border-emerald-500/20">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Good Academic Standing
        </h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
          Your current CGPA is <b>{currentCgpa.toFixed(2)}</b>, comfortably exceeding the minimum {minCgpa.toFixed(2)} threshold for {dept === 'pharmacy' ? 'Pharmacy' : 'Regular'} programs. No probation recovery is needed!
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Alert Banner */}
      <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-700 dark:text-rose-300">
              Academic Probation Warning (CGPA {currentCgpa.toFixed(2)} &lt; {minCgpa.toFixed(2)})
            </h4>
            <p className="text-xs text-rose-600/80 dark:text-rose-300/80 mt-0.5">
              Under UIU Academic Regulations, maintaining a CGPA below {minCgpa.toFixed(2)} results in academic probation. Students on probation cannot register for more than 9–12 credits without departmental advisor approval.
            </p>
          </div>
        </div>
      </div>

      {/* Recovery Scenarios */}
      <Card>
        <CardHeader
          title="Probation Recovery Roadmaps"
          subtitle={`Credits required to raise your CGPA from ${currentCgpa.toFixed(2)} to the safe ≥ ${minCgpa.toFixed(2)} threshold`}
        />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map(s => (
              <div
                key={s.gpa}
                className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {s.label}
                  </span>
                  <div className="mt-2 text-2xl font-extrabold text-apple-blue tabular-nums">
                    {s.creditsNeeded === Infinity ? '—' : `${s.creditsNeeded} cr`}
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 border-t border-black/[0.04] dark:border-white/[0.06] pt-2">
                  {s.terms === Infinity ? 'Cannot recover at this pace' : `Approx. ${s.terms} trimester(s) at 12 cr/term`}
                </div>
              </div>
            ))}
          </div>

          {/* Strategic Advice */}
          <div className="mt-6 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold">Fastest Way to Escape Probation: Retakes</p>
              <p className="opacity-90 leading-relaxed">
                Taking new courses only slowly nudges your CGPA upward. Retaking 1 or 2 courses where you previously received an <b>F or D</b> directly replaces the poor grade with your new grade, instantly removing the deficit from your cumulative record. Check the <b>Retake Optimizer</b> tab above to see your exact jump!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
