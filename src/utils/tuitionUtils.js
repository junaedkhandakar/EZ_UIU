/**
 * EZ_UIU - Tuition Fee & Waiver Calculation Engine
 * Strictly adhering to official United International University financial regulations.
 */

import { DEPT_PROFILES, formatBDT } from './cgpaUtils';

export const SCHOLARSHIP_TIERS = [
  { value: 0, label: '0% — No Waiver' },
  { value: 0.10, label: '10% Merit Waiver' },
  { value: 0.20, label: '20% Merit Waiver' },
  { value: 0.25, label: '25% Merit Waiver' },
  { value: 0.50, label: '50% Merit / Sibling / Freedom Fighter' },
  { value: 0.75, label: '75% Merit Waiver' },
  { value: 1.00, label: '100% Full Free Merit Scholarship' },
];

export function calculateTuitionFees({
  dept = 'regular',
  credits = 12,
  perCreditFee = 5000,
  trimesterFee = 6500,
  scholarshipRate = 0,
  thesisCredits = 0,
  retakeCredits = 0,
}) {
  const profile = DEPT_PROFILES[dept] || DEPT_PROFILES.regular;
  
  // Guard values
  const safeCredits = Math.max(0, parseFloat(credits) || 0);
  const safePerCreditFee = Math.max(0, parseFloat(perCreditFee) || 0);
  const safeTrimesterFee = Math.max(0, parseFloat(trimesterFee) || 0);
  const safeScholarshipRate = Math.max(0, parseFloat(scholarshipRate) || 0);

  // Thesis credits have 0% waiver per UIU regulations
  const actualThesisCredits = Math.min(safeCredits, Math.max(0, parseFloat(thesisCredits) || 0));

  // Retake credits receive 50% discount
  const maxRetake = Math.max(0, safeCredits - actualThesisCredits);
  const actualRetakeCredits = Math.min(maxRetake, Math.max(0, parseFloat(retakeCredits) || 0));

  // Regular courses eligible for merit scholarship
  const regularCredits = Math.max(0, safeCredits - actualThesisCredits - actualRetakeCredits);

  // UIU 9-credit minimum load rule (14 for Pharmacy)
  const meetsMinCredits = safeCredits >= profile.minCreditsForScholarship;
  const underloadAlert = !meetsMinCredits && safeScholarshipRate > 0;

  // 1. Base Tuition
  const baseTuition = safeCredits * safePerCreditFee;

  // 2. Retake Waiver (50% discount on retaken credits)
  const retakeDiscount = actualRetakeCredits * safePerCreditFee * 0.50;

  // 3. Scholarship Discount (applies ONLY to regular credits if min credit requirement met, NEVER on thesis or retakes)
  let scholarshipDiscount = 0;
  if (meetsMinCredits && safeScholarshipRate > 0) {
    scholarshipDiscount = regularCredits * safePerCreditFee * safeScholarshipRate;
  }

  // Total Waiver Discount
  const totalDiscount = scholarshipDiscount + retakeDiscount;

  // 4. Net Tuition & Payable
  const netTuition = Math.max(0, baseTuition - totalDiscount);
  const totalPayable = netTuition + safeTrimesterFee;

  // 5. Installments Calculation
  let installments = [];
  if (dept === 'pharmacy') {
    const inst = Math.round(totalPayable / 4);
    const inst4 = totalPayable - (inst * 3);
    installments = [
      { name: '1st Installment', percentage: '25%', amount: inst, timing: 'Upon Course Registration' },
      { name: '2nd Installment', percentage: '25%', amount: inst, timing: 'Before Midterm Examination' },
      { name: '3rd Installment', percentage: '25%', amount: inst, timing: 'Before Final Examination' },
      { name: '4th Installment', percentage: '25%', amount: inst4, timing: 'End of Semester' },
    ];
  } else {
    const inst1 = Math.round(totalPayable * 0.40);
    const inst2 = Math.round(totalPayable * 0.30);
    const inst3 = totalPayable - inst1 - inst2;
    installments = [
      { name: '1st Installment', percentage: '40%', amount: inst1, timing: 'During Course Registration / Advising' },
      { name: '2nd Installment', percentage: '30%', amount: inst2, timing: 'Before Midterm Examinations' },
      { name: '3rd Installment', percentage: '30%', amount: inst3, timing: 'Before Final Examinations' },
    ];
  }

  return {
    baseTuition,
    retakeDiscount,
    scholarshipDiscount,
    totalDiscount,
    netTuition,
    trimesterFee: safeTrimesterFee,
    totalPayable,
    installments,
    regularCredits,
    thesisCredits: actualThesisCredits,
    retakeCredits: actualRetakeCredits,
    meetsMinCredits,
    underloadAlert,
    minCreditsRequired: profile.minCreditsForScholarship,
  };
}

export function estimateDegreeCost({
  totalDegreeCredits = 138,
  completedCredits = 0,
  perCreditFee = 5000,
  trimesterFee = 6500,
  averageCreditsPerTerm = 12,
  averageScholarshipRate = 0,
}) {
  const safeTotal = Math.max(0, totalDegreeCredits);
  const safeCompleted = Math.min(safeTotal, Math.max(0, completedCredits));
  const remainingCredits = Math.max(0, safeTotal - safeCompleted);

  const totalTerms = Math.ceil(safeTotal / (averageCreditsPerTerm || 12));
  const completedTerms = Math.floor(safeCompleted / (averageCreditsPerTerm || 12));
  const remainingTerms = Math.max(0, totalTerms - completedTerms);

  const effectiveRate = 1 - Math.min(1, Math.max(0, averageScholarshipRate));

  const totalTuition = safeTotal * perCreditFee * effectiveRate;
  const totalTrimesterFees = totalTerms * trimesterFee;
  const totalEstimatedCost = totalTuition + totalTrimesterFees;

  const paidTuition = safeCompleted * perCreditFee * effectiveRate;
  const paidTrimesterFees = completedTerms * trimesterFee;
  const paidCost = paidTuition + paidTrimesterFees;

  const remainingCost = Math.max(0, totalEstimatedCost - paidCost);

  return {
    totalEstimatedCost,
    paidCost,
    remainingCost,
    totalTerms,
    completedTerms,
    remainingTerms,
    remainingCredits,
  };
}
