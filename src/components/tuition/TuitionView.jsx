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
  ShieldCheck,
  CheckCircle2,
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
      {/* Header */}
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
            Print Statement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ============ LEFT: inputs + installments ============ */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          {/* Registration Parameters */}
          <Surface className="p-5">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Registration Parameters</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Department Program</label>
                <Select value={dept} onChange={(e) => setDept(e.target.value)}>
                  {Object.entries(DEPT_PROFILES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Registered Credits</label>
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
                <label className={labelCls}>Per-Credit Tuition (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={perCreditFee}
                  onChange={(e) => setPerCreditFee(parseFloat(e.target.value) || 0)}
                  className={`${inputCls} num font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Trimester Activity Fee (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={trimesterFee}
                  onChange={(e) => setTrimesterFee(parseFloat(e.target.value) || 0)}
                  className={`${inputCls} num font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Thesis Credits (0% waiver)</label>
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
                <label className={labelCls}>Retake Credits (50% off)</label>
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
                <label className={labelCls}>Merit Scholarship Tier</label>
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
                  <b>Underload Policy Warning:</b> Under {deptProfile.minCreditsForScholarship} credits,
                  merit scholarship waivers are forfeited per UIU academic regulations.
                </p>
              </motion.div>
            )}
          </Surface>

          {/* Installments Timeline */}
          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">Installment Payment Schedule</h3>
              <span className="text-[11px] font-semibold text-accent">
                {dept === 'pharmacy' ? '4 Installments' : '3 Installments'}
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

          {/* Degree Estimator */}
          <Surface className="p-5">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent" strokeWidth={2.2} />
              <h3 className="text-[15px] font-bold tracking-tight text-ink">Full Degree Cost Projector</h3>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Average Pace (Cr/Term)</label>
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
                <label className={labelCls}>Expected Long-Term Waiver</label>
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
                  Overall Program Progress
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
                  Paid So Far
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
                  Total Degree
                </div>
                <div className="num mt-1 text-[15px] font-extrabold tracking-tight text-accent">
                  {formatBDT(degree.totalEstimatedCost)}
                </div>
              </div>
            </div>
          </Surface>
        </div>

        {/* ============ RIGHT: luxury notched ticket receipt ============ */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-6">
            <Surface className="relative overflow-hidden border border-line shadow-card">
              {/* Receipt Header */}
              <div className="border-b border-dashed border-line-strong px-5 pb-5 pt-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-fit rounded-xl bg-gradient-to-br from-accent to-accent2 p-2.5 shadow-[0_4px_16px_-4px_var(--accent)]"
                  >
                    <Receipt className="h-5 w-5 text-white" strokeWidth={2.2} />
                  </motion.div>
                </div>
                <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                  Official Statement of Account
                </div>
                <div className="mt-1 text-[14px] font-extrabold text-ink">
                  {deptProfile.name}
                </div>
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/10 px-2.5 py-0.5 text-[10px] font-bold text-ok">
                  <ShieldCheck className="h-3 w-3" />
                  VERIFIED UIU BILLING
                </div>
              </div>

              {/* Perforated ticket punch notches */}
              <div className="relative my-0 flex items-center justify-between">
                <span className="-ml-3 h-6 w-6 rounded-full border border-line bg-base shadow-inner" />
                <span className="flex-1 border-b border-dashed border-line-strong opacity-50" />
                <span className="-mr-3 h-6 w-6 rounded-full border border-line bg-base shadow-inner" />
              </div>

              {/* Receipt Items */}
              <div className="space-y-3 px-6 py-4">
                <Leader
                  label="Gross Tuition Base"
                  value={formatBDT(fees.baseTuition)}
                  sub={`${credits} cr × ৳${perCreditFee.toLocaleString()}`}
                />
                {fees.retakeDiscount > 0 && (
                  <Leader
                    label="Retake Waiver (50% Off)"
                    value={`−${formatBDT(fees.retakeDiscount)}`}
                    accent
                    sub={`${fees.retakeCredits} cr retake discount`}
                  />
                )}
                {fees.scholarshipDiscount > 0 && (
                  <Leader
                    label={`Merit Waiver (${(scholarship * 100).toFixed(0)}%)`}
                    value={`−${formatBDT(fees.scholarshipDiscount)}`}
                    accent
                    sub={`Applied to ${fees.regularCredits} regular credits`}
                  />
                )}
                {fees.thesisCredits > 0 && (
                  <div className="flex items-start gap-2 rounded-lg bg-surface2/70 px-2.5 py-2">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <p className="text-[10.5px] leading-snug text-ink-3">
                      {fees.thesisCredits} Thesis / FYDP credits exempt from waiver per university statute.
                    </p>
                  </div>
                )}
                <div className="!mt-4 border-t border-dashed border-line-strong pt-3">
                  <Leader label="Net Tuition Payable" value={formatBDT(fees.netTuition)} strong />
                </div>
                <Leader label="Trimester Activity Fee" value={formatBDT(fees.trimesterFee)} />
              </div>

              {/* Total Banner */}
              <div className="border-t border-dashed border-line-strong bg-surface2/50 px-6 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
                    Net Total Due
                  </span>
                  {fees.totalDiscount > 0 && (
                    <span className="rounded-md bg-ok/15 px-2 py-0.5 text-[10.5px] font-bold text-ok">
                      Saving {formatBDT(fees.totalDiscount)}
                    </span>
                  )}
                </div>
                <motion.div
                  key={fees.totalPayable}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className="num mt-2 text-[36px] font-extrabold leading-none tracking-tight text-ink"
                >
                  ৳{fees.totalPayable.toLocaleString()}
                </motion.div>
                <div className="num mt-2 text-xs font-semibold text-ink-3">
                  ≈ ৳{Math.round(fees.totalPayable / Math.max(1, fees.installments.length)).toLocaleString()} per installment
                </div>
              </div>

              {/* Credit Composition Bar */}
              <div className="grid grid-cols-3 border-t border-line bg-surface text-center">
                <div className="border-r border-line p-3">
                  <div className="num text-[16px] font-extrabold text-ink">{fees.regularCredits}</div>
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-3">
                    Regular
                  </div>
                </div>
                <div className="border-r border-line p-3">
                  <div className="num text-[16px] font-extrabold text-warn">{fees.retakeCredits}</div>
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-3">
                    Retake
                  </div>
                </div>
                <div className="p-3">
                  <div className="num text-[16px] font-extrabold text-ink-2">{fees.thesisCredits}</div>
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-ink-3">
                    Thesis
                  </div>
                </div>
              </div>

              {/* Barcode graphic footer */}
              <div className="flex flex-col items-center justify-center border-t border-line/60 bg-surface2/30 px-6 py-3.5">
                <div className="flex h-6 items-center gap-[2px] opacity-40 dark:opacity-30">
                  {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3, 2, 7, 9].map((w, idx) => (
                    <span
                      key={idx}
                      className="inline-block h-full bg-ink"
                      style={{ width: `${(w % 3) + 1}px` }}
                    />
                  ))}
                </div>
                <span className="num mt-1 font-mono text-[9px] uppercase tracking-widest text-ink-3">
                  UIU-FIN-2026-REG-{credits}CR
                </span>
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TuitionView;
