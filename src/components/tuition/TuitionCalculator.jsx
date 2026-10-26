import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  calculateTuitionFees,
  estimateDegreeCost,
  SCHOLARSHIP_TIERS,
} from '../../utils/tuitionUtils';
import { formatBDT, DEPT_PROFILES } from '../../utils/cgpaUtils';
import { useToast } from '../../context/ToastContext';
import {
  Wallet,
  Receipt,
  CalendarClock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Printer,
  GraduationCap,
  Percent,
  CheckCircle2,
  Info,
} from 'lucide-react';

export function TuitionCalculator({ courses = [], defaultDept = 'regular' }) {
  const { showToast } = useToast();

  // Form state
  const [dept, setDept] = useState(defaultDept);
  const [credits, setCredits] = useState(12);
  const [perCreditFee, setPerCreditFee] = useState(5000);
  const [trimesterFee, setTrimesterFee] = useState(6500);
  const [scholarshipRate, setScholarshipRate] = useState(0);
  const [thesisCredits, setThesisCredits] = useState(0);
  const [retakeCredits, setRetakeCredits] = useState(0);

  // Degree estimator state
  const [degreeTotalCredits, setDegreeTotalCredits] = useState(138);
  const [completedCredits, setCompletedCredits] = useState(38);

  const profile = DEPT_PROFILES[dept] || DEPT_PROFILES.regular;

  // Sync from CGPA courses
  const handleSyncFromCgpa = () => {
    if (!courses || courses.length === 0) {
      showToast('No courses found in CGPA calculator', 'error');
      return;
    }

    // Find running courses
    const running = courses.filter(c => {
      const st = (c.status || '').toLowerCase();
      return st.includes('running') || !c.grade;
    });

    if (running.length === 0) {
      showToast('No running courses currently detected in your transcript', 'info');
      return;
    }

    const totalRunningCredits = running.reduce((sum, c) => sum + (c.credit || 0), 0);

    // Check for thesis/project courses (CSE 4000A/B/C, DS 4000A, etc.)
    const thesis = running.filter(c => {
      const id = (c.courseId || '').toUpperCase();
      const name = (c.courseName || '').toLowerCase();
      return id.includes('4000') || name.includes('thesis') || name.includes('project') || name.includes('fydp');
    });
    const totalThesisCredits = thesis.reduce((sum, c) => sum + (c.credit || 0), 0);

    // Calculate completed credits
    const completed = courses
      .filter(c => c.grade && c.grade !== 'F' && c.grade !== 'W' && c.grade !== 'Dp')
      .reduce((sum, c) => sum + (c.credit || 0), 0);

    setCredits(totalRunningCredits);
    setThesisCredits(totalThesisCredits);
    setCompletedCredits(completed);

    showToast(`Synced ${totalRunningCredits} credits (${totalThesisCredits}cr thesis) from CGPA!`, 'success');
  };

  // Calculations
  const feeDetails = useMemo(() => {
    return calculateTuitionFees({
      dept,
      credits,
      perCreditFee,
      trimesterFee,
      scholarshipRate,
      thesisCredits,
      retakeCredits,
    });
  }, [dept, credits, perCreditFee, trimesterFee, scholarshipRate, thesisCredits, retakeCredits]);

  const degreeDetails = useMemo(() => {
    return estimateDegreeCost({
      totalDegreeCredits: degreeTotalCredits,
      completedCredits,
      perCreditFee,
      trimesterFee,
      averageCreditsPerTerm: credits || 12,
      averageScholarshipRate: scholarshipRate,
    });
  }, [degreeTotalCredits, completedCredits, perCreditFee, trimesterFee, credits, scholarshipRate]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Title & Deck */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Tuition Fee & Waiver Engine
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Enforcing the UIU 6-credit thesis 0% rule, 50% retake waiver, and official installment schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={Sparkles}
            onClick={handleSyncFromCgpa}
          >
            Sync from CGPA
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Main Grid: Inputs (Left) and Fee Voucher (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <Card>
            <CardHeader
              title="Trimester Registration Parameters"
              subtitle="Configure your enrolled credits and scholarship eligibility"
            />
            <CardContent className="space-y-4">
              {/* Program Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Academic Program
                </label>
                <select
                  value={dept}
                  onChange={e => {
                    const d = e.target.value;
                    setDept(d);
                    const p = DEPT_PROFILES[d] || DEPT_PROFILES.regular;
                    setPerCreditFee(p.defaultTuition);
                    setDegreeTotalCredits(p.defaultCredits);
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
                >
                  <option value="regular">Regular Program (BSCSE, BBA, EEE, etc.)</option>
                  <option value="pharmacy">Pharmacy (B. Pharm.)</option>
                </select>
              </div>

              {/* Total Registered Credits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Registered Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={credits}
                    onChange={e => setCredits(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Per Credit Fee (BDT)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={perCreditFee}
                    onChange={e => setPerCreditFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Trimester Fee
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={trimesterFee}
                    onChange={e => setTrimesterFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
                  />
                </div>
              </div>

              {/* Scholarship Waiver Tier */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Merit Scholarship / Tuition Waiver
                </label>
                <select
                  value={scholarshipRate}
                  onChange={e => setScholarshipRate(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
                >
                  {SCHOLARSHIP_TIERS.map(tier => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Special Credits: Thesis (0% waiver) & Retake (50% waiver) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Thesis / FYDP Credits
                    </label>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      0% Waiver Rule
                    </span>
                  </div>
                  <select
                    value={thesisCredits}
                    onChange={e => setThesisCredits(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
                  >
                    <option value={0}>0 Credits (No thesis)</option>
                    <option value={2}>2 Credits (Thesis Part I / II / III)</option>
                    <option value={3}>3 Credits (Internship / Project)</option>
                    <option value={4}>4 Credits (2 parts combined)</option>
                    <option value={6}>6 Credits (Full FYDP Thesis)</option>
                  </select>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    UIU policy mandates full tuition for thesis/project courses regardless of scholarship.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Retaken Course Credits
                    </label>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      50% Retake Waiver
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={credits}
                    step="1"
                    value={retakeCredits}
                    onChange={e => setRetakeCredits(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    50% automatic tuition waiver applies to all previously failed/retaken credits.
                  </p>
                </div>
              </div>

              {/* Underload Minimum Credits Warning */}
              {feeDetails.underloadAlert && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <p className="font-bold">
                      UIU Scholarship Minimum Credit Requirement Alert
                    </p>
                    <p className="leading-relaxed opacity-90">
                      You are registered for <b>{credits} credits</b>. UIU strictly requires a minimum load of <b>{feeDetails.minCreditsRequired} credits</b> per trimester to maintain merit scholarships. Because your load is below {feeDetails.minCreditsRequired} credits, your scholarship waiver cannot be applied for this trimester.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Installments Schedule */}
          <Card>
            <CardHeader
              title="Official Installment Schedule"
              subtitle={
                dept === 'pharmacy'
                  ? 'Pharmacy 4-installment semester schedule (25% each)'
                  : 'Regular 3-installment trimester schedule: 40% (Advising), 30% (Midterm), 30% (Final)'
              }
            />
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {feeDetails.installments.map((inst, idx) => (
                  <div
                    key={inst.name}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-2 ${
                      idx === 0
                        ? 'bg-apple-blue/[0.04] border-apple-blue/30 dark:bg-apple-blue/[0.08]'
                        : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {inst.name}
                        </span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.1] text-zinc-600 dark:text-zinc-400">
                          {inst.percentage}
                        </span>
                      </div>
                      <div className="mt-2 text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tabular-nums">
                        {formatBDT(inst.amount)}
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 leading-tight">
                      {inst.timing}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Printable Fee Summary Voucher (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5 sticky top-20">
          <Card className="border-apple-blue/20 shadow-apple-md overflow-hidden">
            <div className="bg-gradient-to-r from-apple-blue to-blue-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                  Total Payable This Term
                </span>
                <Receipt className="w-5 h-5 text-white/80" />
              </div>
              <div className="mt-2 text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight">
                {formatBDT(feeDetails.totalPayable)}
              </div>
              <p className="text-xs text-blue-100/90 mt-1">
                {credits} credits enrolled · {feeDetails.regularCredits} regular, {feeDetails.thesisCredits} thesis, {feeDetails.retakeCredits} retake
              </p>
            </div>

            <CardContent className="divide-y divide-black/[0.06] dark:divide-white/[0.08] text-xs">
              {/* Base Tuition */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Base Tuition ({credits} cr × {formatBDT(perCreditFee)})
                </span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {formatBDT(feeDetails.baseTuition)}
                </span>
              </div>

              {/* Scholarship Waiver */}
              {feeDetails.scholarshipDiscount > 0 && (
                <div className="py-3 flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>
                    Merit Waiver ({Math.round(scholarshipRate * 100)}% on {feeDetails.regularCredits} cr)
                  </span>
                  <span className="font-bold tabular-nums">
                    -{formatBDT(feeDetails.scholarshipDiscount)}
                  </span>
                </div>
              )}

              {/* Retake Waiver */}
              {feeDetails.retakeDiscount > 0 && (
                <div className="py-3 flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>
                    50% Retake Waiver ({feeDetails.retakeCredits} cr)
                  </span>
                  <span className="font-bold tabular-nums">
                    -{formatBDT(feeDetails.retakeDiscount)}
                  </span>
                </div>
              )}

              {/* Net Tuition */}
              <div className="py-3 flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                <span>Net Tuition Fee</span>
                <span className="tabular-nums">{formatBDT(feeDetails.netTuition)}</span>
              </div>

              {/* Trimester Fee */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Trimester Fixed Fee</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {formatBDT(feeDetails.trimesterFee)}
                </span>
              </div>

              {/* Total Payable */}
              <div className="pt-3 flex items-center justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                <span>Total Term Due</span>
                <span className="text-apple-blue tabular-nums text-base">
                  {formatBDT(feeDetails.totalPayable)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Degree Cost Projection Mini-Card */}
          <Card>
            <CardHeader
              title="Full Degree Investment Estimator"
              subtitle="Projected graduation cost based on completed credits"
            />
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Degree Progress:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {completedCredits} of {degreeTotalCredits} cr ({Math.round((completedCredits / degreeTotalCredits) * 100)}%)
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-apple-blue rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (completedCredits / degreeTotalCredits) * 100)}%` }}
                />
              </div>

              <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-zinc-500">Estimated Total Degree Cost:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {formatBDT(degreeDetails.totalEstimatedCost)}
                </span>
              </div>

              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span>Approx. Paid So Far:</span>
                <span className="font-bold tabular-nums">
                  {formatBDT(degreeDetails.paidCost)}
                </span>
              </div>

              <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100 pt-1">
                <span>Estimated Remaining Cost:</span>
                <span className="text-apple-blue tabular-nums">
                  {formatBDT(degreeDetails.remainingCost)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
