import React, { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, Lightbulb } from 'lucide-react';
import Surface from '../ui/Surface';
import { type } from '../ui/tokens';
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
      <Surface className="flex flex-col items-center px-6 py-12 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ok/10 text-ok">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <h3 className={`${type.sectionTitle} mt-3`}>Good academic standing</h3>
        <p className={`${type.body} mt-1.5 max-w-md`}>
          CGPA <b className="num">{metrics.cgpa.toFixed(2)}</b> clears the {minCgpa.toFixed(2)}{' '}
          threshold for {dept === 'pharmacy' ? 'Pharmacy' : 'Regular'} programs. No recovery plan
          needed — keep the streak going.
        </p>
      </Surface>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Alert */}
      <div className="flex items-start gap-3.5 rounded-xl border border-bad/25 bg-bad/[0.07] p-4">
        <span className="shrink-0 rounded-lg bg-bad/15 p-2 text-bad">
          <ShieldAlert className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div>
          <h4 className={type.cardTitle}>
            Academic probation — CGPA <span className="num">{metrics.cgpa.toFixed(2)}</span> &lt;{' '}
            <span className="num">{minCgpa.toFixed(2)}</span>
          </h4>
          <p className={`${type.body} mt-1`}>
            UIU regulations place students below {minCgpa.toFixed(2)} on probation: registration is
            capped at 9–12 credits without advisor approval. Below are the exact credits needed to
            clear it.
          </p>
        </div>
      </div>

      {/* Scenario tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {scenarios.map((s) => (
          <Surface key={s.gpa} pad="sm">
            <div className="text-[12px] font-semibold text-ink-2">{s.label}</div>
            <div className="num mt-2 text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">
              {s.creditsNeeded === Infinity ? '—' : `${s.creditsNeeded} cr`}
            </div>
            <div className={`${type.micro} mt-1.5 font-medium`}>
              {s.terms === Infinity
                ? 'not achievable'
                : `≈ ${s.terms} trimester${s.terms > 1 ? 's' : ''} @ 12 cr`}
            </div>
            <div className="num mt-3 rounded-md bg-surface2 px-2 py-1 text-center text-[10.5px] font-semibold text-ink-2">
              GPA {s.gpa.toFixed(2)}
            </div>
          </Surface>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-line bg-surface2/50 p-4">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" strokeWidth={2.2} />
        <p className={type.body}>
          Fastest path: pair retakes of low-grade courses (they replace old points entirely) with a
          12-credit load at A− or better. Check the <b className="text-ink">Retake Lab</b> tab to
          simulate exactly how far each retake lifts you.
        </p>
      </div>
    </div>
  );
}

export default ProbationRecovery;
