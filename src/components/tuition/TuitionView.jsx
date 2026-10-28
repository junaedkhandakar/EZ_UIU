import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Receipt,
  Printer,
  AlertTriangle,
  BookMarked,
  GraduationCap,
  RefreshCw,
  Info,
} from 'lucide-react';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import Select from '../ui/Select';
import { calculateTuitionFees, estimateDegreeCost, SCHOLARSHIP_TIERS } from '../../utils/tuitionUtils';
import { DEPT_PROFILES, formatBDT, getEffectiveCourses, calculateAcademicMetrics } from '../../utils/cgpaUtils';
import { useToast } from '../../context/ToastContext';

const inputCls =
  'w-full rounded-xl border border-line bg-surface2/70 px-3.5 py-2.5 text-[13px] text-ink placeholder-ink-3 transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40';
const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3';

function Leader({ label, value, strong = false, accent = false, sub }) {
  return (
    <div>
      <div className="flex items-baseline">
        <span className={`shrink-0 text-[12.5px] ${strong ? 'font-bold text-ink' : 'font-medium text-ink-2'}`}>
          {label}
        </span>
        <span className="mx-2 flex-1 border-b border-dotted border-line-strong opacity-60" />
        <span
          className={`num shrink-0 text-[12.5px] ${
            accent ? 'font-bold text-ok' : strong ? 'font-bold text-ink' : 'font-semibold text-ink-2'
          }`}
        >
          {value}
        </span>
      </div>
      {sub && <div className="num mt-0.5 text-[10px] text-ink-3">{sub}</div>}
    </div>
  );
}

export function TuitionView({ courses = [], settings = {}, defaultDept = 'regular' }) {
  const { showToast } = useToast();
  const profile = DEPT_PROFILES[defaultDept] || DEPT_PROFILES.regular;

  const [dept, setDept] = useState(defaultDept);
  const [credits, setCredits] = useState(12);
  const [perCreditFee, setPerCreditFee] = useState(settings.tuitionPerCredit ?? 5000);
  const [trimesterFee, setTrimesterFee] = useState(settings.perTrimesterFee ?? 6500);
  const [scholarship, setScholarship] = useState(0);
  const [thesisCredits, setThesisCredits] = useState(0);
  const [retakeCredits, setRetakeCredits] = useState(0);

  const [avgCredits, setAvgCredits] = useState(12);
  const [avgScholarship, setAvgScholarship] = useState(0);

  const deptProfile = DEPT_PROFILES[dept] || DEPT_PROFILES.regular;

  const fees = useMemo(
    () =>
      calculateTuitionFees({
        dept,
        credits,
        perCreditFee,
        trimesterFee,
        scholarshipRate: scholarship,
        thesisCredits,
        retakeCredits,
      }),
    [dept, credits, perCreditFee, trimesterFee, scholarship, thesisCredits, retakeCredits]
  );

  const completedCredits = useMemo(() => {
    const metrics = calculateAcademicMetrics(getEffectiveCourses(courses));
    return metrics.earnedCredits || 0;
  }, [courses]);

  const degree = useMemo(
    () =>
      estimateDegreeCost({
        totalDegreeCredits: settings.programCredits || profile.defaultCredits,
        completedCredits,
        perCreditFee,
        trimesterFee,
        averageCreditsPerTerm: avgCredits,
        averageScholarshipRate: avgScholarship,
      }),
    [settings.programCredits, profile.defaultCredits, completedCredits, perCreditFee, trimesterFee, avgCredits, avgScholarship]
  );

  const syncFromCGPA = () => {
    const effective = getEffectiveCourses(courses);
    const running = effective.filter(
      (c) => !c.grade || (c.status || '').toLowerCase().includes('running')
    );
    const runningCredits = running.reduce((s, c) => s + (c.credit || 0), 0);
    const runningRetakes = running
      .filter((c) => (c.retakeOf || '').trim() !== '')
      .reduce((s, c) => s + (c.credit || 0), 0);
    if (runningCredits) setCredits(runningCredits);
    setRetakeCredits(runningRetakes);
    showToast(
      runningCredits
        ? `Synced ${runningCredits} running credits from transcript`
        : 'No running courses found in transcript',
      runningCredits ? 'success' : 'info'
    );
  };

  const print = () => window.print();

  return (
    <div className="flex flex-col gap-5">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            {deptProfile.name} · official waiver rules
          </div>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink sm:text-3xl">
            Tuition & Waivers
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={syncFromCGPA}>
            Sync from CGPA
          </Button>
          <Button variant="secondary" icon={Printer} onClick={print}>
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ============ LEFT: inputs + installments ============ */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          {/* registration card */}
          <Surface className="p-5">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Registration</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Program</label>
                <Select value={dept} onChange={(e) => setDept(e.target.value)}>
                  {Object.entries(DEPT_PROFILES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Registered credits</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={credits}
                  onChange={(e) => setCredits(parseFloat(e.target.value) || 0)}
                  className={`${inputCls} num font-mono font-semibold`}
                />
              </div>
              <div>
                <label className={labelCls}>Per-credit fee (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={perCreditFee}
                  onChange={(e) => setPerCreditFee(parseFloat(e.target.value) || 0)}
                  className={`${inputCls} num font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Trimester fee (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={trimesterFee}
                  onChange={(e) => setTrimesterFee(parseFloat(e.target.value) || 0)}
                  className={`${inputCls} num font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Thesis credits (0% waiver)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={thesisCredits}
                  onChange={(e) => setThesisCredits(parseFloat(e.target.value) || 0)}
                  className={`${inputCls} num font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Retake credits (50% off)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={retakeCredits}
                  onChange={(e) => setRetakeCredits(parseFloat(e.target.value) || 0)}
                  className={`${inputCls} num font-mono`}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Merit waiver tier</label>
                <Select
                  value={scholarship}
                  onChange={(e) => setScholarship(parseFloat(e.target.value))}
                >
                  {SCHOLARSHIP_TIERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {fees.underloadAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-warn/25 bg-warn/10 p-3.5"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" strokeWidth={2.2} />
                <p className="text-xs leading-relaxed text-warn">
                  Under {deptProfile.minCreditsForScholarship} credits, merit waivers are forfeited
                  this term under the minimum-load rule.
                </p>
              </motion.div>
            )}
          </Surface>

          {/* installments timeline */}
          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">Installments</h3>
              <span className="text-[11px] font-medium text-ink-3">
                {dept === 'pharmacy' ? '4 payments' : '3 payments'}
              </span>
            </div>
            <ol className="relative mt-4 space-y-0">
              {fees.installments.map((inst, i) => (
                <li key={inst.name} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < fees.installments.length - 1 && (
                    <span className="absolute left-[7px] top-5 h-full w-px bg-line" />
                  )}
                  <span
                    className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] ${
                      i === 0 ? 'border-accent bg-accentSoft' : 'border-line-strong bg-surface2'
                    }`}
                  />
                  <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4">
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-ink">
                        {inst.name}
                        <span className="num ml-2 rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink-3">
                          {inst.percentage}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-ink-3">{inst.timing}</div>
                    </div>
                    <div className="num text-[15px] font-extrabold tracking-tight text-ink">
                      {formatBDT(inst.amount)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Surface>

          {/* degree estimator */}
          <Surface className="p-5">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent" strokeWidth={2.2} />
              <h3 className="text-[15px] font-bold tracking-tight text-ink">Full degree estimate</h3>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Avg credits / term</label>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={avgCredits}
                  onChange={(e) => setAvgCredits(Math.max(1, parseFloat(e.target.value) || 12))}
                  className={`${inputCls} num font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Avg waiver</label>
                <Select value={avgScholarship} onChange={(e) => setAvgScholarship(parseFloat(e.target.value))}>
                  {SCHOLARSHIP_TIERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
                <span className="font-semibold uppercase tracking-[0.08em] text-ink-3">
                  Degree progress
                </span>
                <span className="num font-bold text-ink">
                  {completedCredits} / {settings.programCredits || profile.defaultCredits} cr ·{' '}
                  {degree.totalTerms} terms total
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface2">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      settings.programCredits
                        ? Math.min(100, (completedCredits / settings.programCredits) * 100)
                        : 0
                    }%`,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-line bg-surface2/50 p-3">
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                  Paid so far
                </div>
                <div className="num mt-1 text-[15px] font-extrabold tracking-tight text-ink">
                  {formatBDT(degree.paidCost)}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-surface2/50 p-3">
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                  Remaining
                </div>
                <div className="num mt-1 text-[15px] font-extrabold tracking-tight text-warn">
                  {formatBDT(degree.remainingCost)}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-surface2/50 p-3">
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                  Total degree
                </div>
                <div className="num mt-1 text-[15px] font-extrabold tracking-tight text-accent">
                  {formatBDT(degree.totalEstimatedCost)}
                </div>
              </div>
            </div>
          </Surface>
        </div>

        {/* ============ RIGHT: receipt ============ */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-6">
            <Surface className="overflow-hidden">
              {/* receipt head */}
              <div className="border-b border-dashed border-line-strong px-5 pb-4 pt-5 text-center">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  className="mx-auto w-fit rounded-xl bg-gradient-to-br from-accent to-accent2 p-2.5 shadow-[0_4px_16px_-4px_var(--accent)]"
                >
                  <Receipt className="h-5 w-5 text-white" strokeWidth={2.2} />
                </motion.div>
                <div className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">
                  Fee statement
                </div>
                <div className="mt-0.5 text-[13px] font-bold text-ink">
                  {deptProfile.name} · {credits} credits
                </div>
              </div>

              {/* receipt body */}
              <div className="space-y-2.5 px-5 py-4">
                <Leader
                  label="Tuition base"
                  value={formatBDT(fees.baseTuition)}
                  sub={`${credits} cr × ৳${perCreditFee.toLocaleString()}`}
                />
                {fees.retakeDiscount > 0 && (
                  <Leader label="Retake waiver (50%)" value={`−${formatBDT(fees.retakeDiscount)}`} accent />
                )}
                {fees.scholarshipDiscount > 0 && (
                  <Leader
                    label={`Merit waiver (${(scholarship * 100).toFixed(0)}%)`}
                    value={`−${formatBDT(fees.scholarshipDiscount)}`}
                    accent
                  />
                )}
                {fees.thesisCredits > 0 && (
                  <div className="flex items-start gap-2 rounded-lg bg-surface2/60 px-2.5 py-2">
                    <Info className="mt-0.5 h-3 w-3 shrink-0 text-ink-3" />
                    <p className="text-[10.5px] leading-snug text-ink-3">
                      {fees.thesisCredits} thesis credit(s) — no waiver applies per UIU policy.
                    </p>
                  </div>
                )}
                <div className="!mt-3 border-t border-dashed border-line-strong pt-3">
                  <Leader label="Net tuition" value={formatBDT(fees.netTuition)} strong />
                </div>
                <Leader label="Trimester fee" value={formatBDT(fees.trimesterFee)} />
              </div>

              {/* total */}
              <div className="border-t border-dashed border-line-strong bg-surface2/40 px-5 py-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
                  Total payable
                </div>
                <motion.div
                  key={fees.totalPayable}
                  initial={{ scale: 0.96 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="num mt-1 text-[34px] font-extrabold leading-none tracking-tight text-ink"
                >
                  ৳{fees.totalPayable.toLocaleString()}
                </motion.div>
                <div className="num mt-2 text-[11px] font-medium text-ink-3">
                  ≈ ৳{Math.round(fees.totalPayable / Math.max(1, fees.installments.length)).toLocaleString()} / installment
                  {fees.totalDiscount > 0 && (
                    <span className="ml-1 font-bold text-ok">
                      (saving ৳{fees.totalDiscount.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>

              {/* credit mix */}
              <div className="flex border-t border-line text-center">
                <div className="flex-1 border-r border-line px-2 py-3">
                  <div className="num text-[15px] font-extrabold text-ink">{fees.regularCredits}</div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Regular
                  </div>
                </div>
                <div className="flex-1 border-r border-line px-2 py-3">
                  <div className="num text-[15px] font-extrabold text-warn">{fees.retakeCredits}</div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Retake
                  </div>
                </div>
                <div className="flex-1 px-2 py-3">
                  <div className="num text-[15px] font-extrabold text-ink-2">{fees.thesisCredits}</div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Thesis
                  </div>
                </div>
              </div>
            </Surface>

            <p className="mt-3 flex items-start gap-2 px-1 text-[10.5px] leading-relaxed text-ink-3">
              <BookMarked className="mt-0.5 h-3 w-3 shrink-0" />
              Rates reflect published UIU fees. Verify final amounts on UCam before paying.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TuitionView;
