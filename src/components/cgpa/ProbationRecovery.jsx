import React, { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, Lightbulb } from 'lucide-react';
import { calculateAcademicMetrics } from '../../utils/cgpaUtils';

export function ProbationRecovery({ courses = [], minCgpa = 2.0, dept = 'regular' }) {
  const metrics = useMemo(() => calculateAcademicMetrics(courses), [courses]);
  const onProbation = metrics.cgpa < minCgpa && metrics.credits > 0;

  const scenarios = useMemo(() => {
    if (!onProbation) return [];
    const deficit = minCgpa * metrics.credits - metrics.points;
    return [
      { gpa: 4.0, label: 'Straight A' },
      { gpa: 3.67, label: 'A− average' },
      { gpa: 3.33, label: 'B+ average' },
      { gpa: 3.0, label: 'B average' },
    ].map((t) => {
      const perCredit = t.gpa - minCgpa;
      const creditsNeeded = perCredit > 0 ? Math.ceil(deficit / perCredit) : Infinity;
      return { ...t, creditsNeeded, terms: Math.ceil(creditsNeeded / 12) };
    });
  }, [onProbation, minCgpa, metrics]);

  if (!onProbation) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-ok/20 bg-ok/[0.04] px-6 py-12 text-center shadow-card">
        <div className="rounded-2xl bg-ok/10 p-3 text-ok">
          <ShieldCheck className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <h3 className="mt-3 text-[15px] font-bold text-ink">Good academic standing</h3>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-ink-2">
          CGPA <b className="num">{metrics.cgpa.toFixed(2)}</b> clears the {minCgpa.toFixed(2)}{' '}
          threshold for {dept === 'pharmacy' ? 'Pharmacy' : 'Regular'} programs. No recovery plan
          needed — keep the streak going.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Alert */}
      <div className="flex items-start gap-3.5 rounded-2xl border border-bad/25 bg-bad/[0.07] p-5">
        <div className="shrink-0 rounded-xl bg-bad/15 p-2 text-bad">
          <ShieldAlert className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-bad">
            Academic probation — CGPA {metrics.cgpa.toFixed(2)} &lt; {minCgpa.toFixed(2)}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-ink-2">
            UIU regulations place students below {minCgpa.toFixed(2)} on probation: registration is
            capped at 9–12 credits without advisor approval. Below are the exact credits needed to
            clear it.
          </p>
        </div>
      </div>

      {/* Scenario tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {scenarios.map((s) => (
          <div
            key={s.gpa}
            className="flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card"
          >
            <div className="text-xs font-bold text-ink-2">{s.label}</div>
            <div className="num mt-2 text-[26px] font-extrabold leading-none tracking-tight text-ink">
              {s.creditsNeeded === Infinity ? '—' : `${s.creditsNeeded} cr`}
            </div>
            <div className="mt-1.5 text-[11px] font-medium text-ink-3">
              {s.terms === Infinity ? 'not achievable' : `≈ ${s.terms} trimester${s.terms > 1 ? 's' : ''} @ 12 cr`}
            </div>
            <div className="num mt-3 rounded-lg bg-surface2 px-2 py-1 text-center text-[10px] font-semibold text-ink-2">
              GPA {s.gpa.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface2/50 p-4">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" strokeWidth={2.2} />
        <p className="text-xs leading-relaxed text-ink-2">
          Fastest path: pair retakes of low-grade courses (they replace old points entirely) with a
          12-credit load at A− or better. Check the <b className="text-ink">Retake Lab</b> tab to
          simulate exactly how far each retake lifts you.
        </p>
      </div>
    </div>
  );
}

export default ProbationRecovery;
