/**
 * EZ_UIU - Tuition Fee Calculator
 * UIU Waiver Policies, Thesis (0% Waiver), Retake Discounts, Installments & Degree Cost Projections
 */

(function () {
    'use strict';

    // Storage Keys
    const STORAGE_COURSES_KEY = 'ez_uiu_courses';
    const STORAGE_SETTINGS_KEY = 'ez_uiu_settings';

    // Default Program Constants
    const DEFAULTS = {
        regular: {
            name: 'Regular Program',
            minCreditsForScholarship: 9,
            defaultCredits: 138,
            defaultTuition: 5000,
            trimesterFee: 6500,
            pace: 12
        },
        pharmacy: {
            name: 'Pharmacy (B. Pharm.)',
            minCreditsForScholarship: 14,
            defaultCredits: 165,
            defaultTuition: 5500,
            trimesterFee: 6500,
            pace: 15
        }
    };

    // Format Currency BDT
    function formatBDT(amount) {
        return '৳' + Math.round(amount).toLocaleString('en-BD');
    }

    // Toast Notification
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `clean-toast toast-${type}`;
        const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
        toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.2s ease';
            setTimeout(() => toast.remove(), 200);
        }, 3000);
    }

    // DOM Elements
    const deptSelect = document.getElementById('tuitionDept');
    const creditsInput = document.getElementById('tuitionCredits');
    const perCreditInput = document.getElementById('tuitionPerCredit');
    const trimesterFeeInput = document.getElementById('tuitionTrimesterFee');
    const scholarshipSelect = document.getElementById('tuitionScholarship');
    const thesisCreditsSelect = document.getElementById('tuitionThesisCredits');
    const retakeCreditsInput = document.getElementById('tuitionRetakeCredits');
    const btnSyncFromCgpa = document.getElementById('btnSyncFromCgpa');
    const creditLoadAlert = document.getElementById('creditLoadAlert');

    // Display Elements
    const dispBaseTuition = document.getElementById('dispBaseTuition');
    const dispCreditsSub = document.getElementById('dispCreditsSub');
    const dispTotalDiscount = document.getElementById('dispTotalDiscount');
    const dispDiscountSub = document.getElementById('dispDiscountSub');
    const dispTrimesterFee = document.getElementById('dispTrimesterFee');
    const dispTotalPayable = document.getElementById('dispTotalPayable');
    const installmentsContainer = document.getElementById('installmentsContainer');
    const installmentDesc = document.getElementById('installmentDesc');

    // Degree Projection Elements
    const degreeTotalCreditsInput = document.getElementById('degreeTotalCredits');
    const degreeCompletedCreditsInput = document.getElementById('degreeCompletedCredits');
    const degreeTotalCost = document.getElementById('degreeTotalCost');
    const degreePaidCost = document.getElementById('degreePaidCost');
    const degreePaidSub = document.getElementById('degreePaidSub');
    const degreeRemainingCost = document.getElementById('degreeRemainingCost');
    const degreeRemainingSub = document.getElementById('degreeRemainingSub');

    // Calculate and update view
    function calculate() {
        const dept = deptSelect.value;
        const config = DEFAULTS[dept] || DEFAULTS.regular;
        const credits = parseFloat(creditsInput.value) || 0;
        const perCreditFee = parseFloat(perCreditInput.value) || 0;
        const trimesterFee = parseFloat(trimesterFeeInput.value) || 0;
        const scholarshipRate = parseFloat(scholarshipSelect.value) || 0;

        // Thesis Credits: 0% waiver (full tuition must be paid per UIU policy)
        const thesisCredits = Math.min(credits, parseFloat(thesisCreditsSelect.value) || 0);

        // Retake Credits: 50% waiver
        const retakeCredits = Math.min(Math.max(0, credits - thesisCredits), parseFloat(retakeCreditsInput.value) || 0);

        // Regular Course Credits: eligible for merit scholarship
        const regularCredits = Math.max(0, credits - thesisCredits - retakeCredits);

        // Check UIU 9-credit minimum rule (14 for Pharmacy)
        const meetsMinCredits = credits >= config.minCreditsForScholarship;
        if (creditLoadAlert) {
            if (!meetsMinCredits && scholarshipRate > 0) {
                creditLoadAlert.style.display = 'flex';
                creditLoadAlert.innerHTML = `
                    <i class="fas fa-triangle-exclamation" style="color: #f59e0b; margin-top: 2px;"></i>
                    <div>
                        <b>UIU Policy Alert:</b> Registered for ${credits} credits. UIU requires a minimum of <b>${config.minCreditsForScholarship} credits</b> per trimester (${dept === 'pharmacy' ? 'Pharmacy' : 'Regular'}) to maintain/avail scholarships. Scholarship waiver cannot be applied for this term.
                    </div>
                `;
            } else {
                creditLoadAlert.style.display = 'none';
            }
        }

        // 1. Base Tuition
        const baseTuition = credits * perCreditFee;

        // 2. Retake Waiver (50% discount on retaken credits)
        const retakeDiscount = retakeCredits * perCreditFee * 0.50;

        // 3. Scholarship Discount (applies ONLY to regular credits if min credit requirement met, NEVER on thesis or retakes)
        let scholarshipDiscount = 0;
        if (meetsMinCredits && scholarshipRate > 0) {
            scholarshipDiscount = regularCredits * perCreditFee * scholarshipRate;
        }

        // Total Waiver Discount
        const totalDiscount = scholarshipDiscount + retakeDiscount;

        // 4. Trimester Fee & Total
        const netTuition = Math.max(0, baseTuition - totalDiscount);
        const totalPayable = netTuition + trimesterFee;

        dispBaseTuition.textContent = formatBDT(baseTuition);
        dispTotalDiscount.textContent = `-${formatBDT(totalDiscount)}`;
        dispTrimesterFee.textContent = formatBDT(trimesterFee);
        dispTotalPayable.textContent = formatBDT(totalPayable);

        let creditBreakdownText = `${credits} total credits`;
        if (thesisCredits > 0 || retakeCredits > 0) {
            creditBreakdownText = `${regularCredits} regular · ${thesisCredits} thesis (0% waiver) · ${retakeCredits} retake`;
        }
        dispCreditsSub.textContent = creditBreakdownText;

        // Breakdown subtext
        let discountDesc = '';
        if (!meetsMinCredits && scholarshipRate > 0) {
            discountDesc = `0% applied (underloaded < ${config.minCreditsForScholarship}cr)`;
        } else if (scholarshipRate > 0 && thesisCredits > 0) {
            discountDesc = `${Math.round(scholarshipRate * 100)}% on ${regularCredits}cr regular · 0% on ${thesisCredits}cr thesis`;
        } else if (scholarshipRate > 0 && retakeCredits > 0) {
            discountDesc = `${Math.round(scholarshipRate * 100)}% on ${regularCredits}cr · 50% on ${retakeCredits}cr retake`;
        } else if (scholarshipRate > 0) {
            discountDesc = `${Math.round(scholarshipRate * 100)}% scholarship on ${regularCredits} credits`;
        } else if (retakeCredits > 0) {
            discountDesc = `50% waiver on ${retakeCredits} credits retake`;
        } else if (thesisCredits > 0) {
            discountDesc = `Full fee on ${thesisCredits}cr thesis (no waiver)`;
        } else {
            discountDesc = 'No scholarship applied';
        }
        dispDiscountSub.textContent = discountDesc;

        // 6. Installments Breakdown
        if (dept === 'pharmacy') {
            installmentDesc.textContent = 'Pharmacy programs follow a 4-installment semester schedule (25% each).';
            const instAmount = Math.round(totalPayable / 4);
            const inst4 = totalPayable - (instAmount * 3);
            installmentsContainer.innerHTML = `
                <div class="inst-card inst-card-first">
                    <div class="inst-num">1st Installment (25%)</div>
                    <div class="inst-val">${formatBDT(instAmount)}</div>
                </div>
                <div class="inst-card">
                    <div class="inst-num">2nd Installment (25%)</div>
                    <div class="inst-val">${formatBDT(instAmount)}</div>
                </div>
                <div class="inst-card">
                    <div class="inst-num">3rd Installment (25%)</div>
                    <div class="inst-val">${formatBDT(instAmount)}</div>
                </div>
                <div class="inst-card">
                    <div class="inst-num">4th Installment (25%)</div>
                    <div class="inst-val">${formatBDT(inst4)}</div>
                </div>
            `;
        } else {
            installmentDesc.textContent = 'Regular programs follow UIU official 3-installment trimester schedule: 40% (registration), 30% (midterm), 30% (final).';
            const inst1 = Math.round(totalPayable * 0.40);
            const inst2 = Math.round(totalPayable * 0.30);
            const inst3 = totalPayable - inst1 - inst2;
            installmentsContainer.innerHTML = `
                <div class="inst-card inst-card-first">
                    <div class="inst-num">1st Installment (40%)</div>
                    <div class="inst-val">${formatBDT(inst1)}</div>
                </div>
                <div class="inst-card">
                    <div class="inst-num">2nd Installment (30%)</div>
                    <div class="inst-val">${formatBDT(inst2)}</div>
                </div>
                <div class="inst-card">
                    <div class="inst-num">3rd Installment (30%)</div>
                    <div class="inst-val">${formatBDT(inst3)}</div>
                </div>
            `;
        }

        // 7. Degree Tuition Cost Estimation
        const totalProgramCredits = parseFloat(degreeTotalCreditsInput.value) || config.defaultCredits;
        const completedCredits = parseFloat(degreeCompletedCreditsInput.value) || 0;
        const remainingCredits = Math.max(0, totalProgramCredits - completedCredits);

        const estTerms = Math.ceil(totalProgramCredits / config.pace);
        const estTotalCost = (totalProgramCredits * perCreditFee) + (estTerms * trimesterFee);
        const estPaidCost = completedCredits * perCreditFee;
        const estRemainingCost = remainingCredits * perCreditFee;

        degreeTotalCost.textContent = formatBDT(estTotalCost);
        degreePaidCost.textContent = formatBDT(estPaidCost);
        degreePaidSub.textContent = `${completedCredits} of ${totalProgramCredits} credits done`;
        degreeRemainingCost.textContent = formatBDT(estRemainingCost);
        degreeRemainingSub.textContent = `${remainingCredits} credits remaining to graduate`;
    }

    // Auto-sync from stored CGPA Calculator Data
    function syncFromCgpa() {
        try {
            const savedCoursesRaw = localStorage.getItem(STORAGE_COURSES_KEY) || localStorage.getItem('uiu-gpa:courses');
            const savedSettingsRaw = localStorage.getItem(STORAGE_SETTINGS_KEY) || localStorage.getItem('uiu-gpa:settings');

            if (savedSettingsRaw) {
                const s = JSON.parse(savedSettingsRaw);
                if (s.dept) deptSelect.value = s.dept;
                if (s.tuitionPerCredit) perCreditInput.value = s.tuitionPerCredit;
                if (s.perTrimesterFee) trimesterFeeInput.value = s.perTrimesterFee;
                if (s.programCredits) degreeTotalCreditsInput.value = s.programCredits;
            }

            if (savedCoursesRaw) {
                const courseList = JSON.parse(savedCoursesRaw);
                // Running courses
                const runningCourses = courseList.filter(c => (c.status || '').toLowerCase().includes('running') || c.grade === 'RUNNING');
                const runningCr = runningCourses.reduce((sum, c) => sum + (c.credit || 0), 0);
                if (runningCr > 0) {
                    creditsInput.value = runningCr;
                }

                // Detect Thesis Course (e.g. CSE 4000A / Part I / II / III or "thesis" / "design project")
                let detectedThesisCr = 0;
                runningCourses.forEach(c => {
                    const id = (c.courseId || '').toUpperCase();
                    const name = (c.courseName || '').toLowerCase();
                    if (id.includes('4000') || name.includes('thesis') || name.includes('project') || name.includes('internship')) {
                        detectedThesisCr += (c.credit || 2);
                    }
                });

                if (detectedThesisCr > 0) {
                    thesisCreditsSelect.value = String(Math.min(6, detectedThesisCr));
                }

                // Completed credits
                const GRADE_POINTS = { 'A': 4, 'A-': 3.67, 'B+': 3.33, 'B': 3, 'B-': 2.67, 'C+': 2.33, 'C': 2, 'C-': 1.67, 'D+': 1.33, 'D': 1 };
                const completedCr = courseList.filter(c => GRADE_POINTS.hasOwnProperty(c.grade)).reduce((sum, c) => sum + (c.credit || 0), 0);
                if (completedCr > 0) {
                    degreeCompletedCreditsInput.value = completedCr;
                }

                showToast(`Synced! ${runningCr} running cr (${detectedThesisCr > 0 ? detectedThesisCr + 'cr thesis detected' : 'regular'}), ${completedCr}cr completed.`, 'success');
            } else {
                showToast('No saved courses found. You can add courses in the CGPA Calculator first.', 'info');
            }

            calculate();
        } catch (e) {
            console.error('Error syncing:', e);
            showToast('Could not sync with stored data', 'error');
        }
    }

    // Initialize Event Listeners
    function init() {
        try {
            const savedSettingsRaw = localStorage.getItem(STORAGE_SETTINGS_KEY) || localStorage.getItem('uiu-gpa:settings');
            if (savedSettingsRaw) {
                const s = JSON.parse(savedSettingsRaw);
                if (s.dept) deptSelect.value = s.dept;
                if (s.tuitionPerCredit) perCreditInput.value = s.tuitionPerCredit;
                if (s.perTrimesterFee) trimesterFeeInput.value = s.perTrimesterFee;
                if (s.programCredits) degreeTotalCreditsInput.value = s.programCredits;
            }
        } catch (e) {
            // ignore
        }

        // Program department change
        deptSelect.addEventListener('change', () => {
            const dept = deptSelect.value;
            const def = DEFAULTS[dept] || DEFAULTS.regular;
            perCreditInput.value = def.defaultTuition;
            trimesterFeeInput.value = def.trimesterFee;
            degreeTotalCreditsInput.value = def.defaultCredits;
            calculate();
            showToast(`Switched to ${def.name}`, 'info');
        });

        // Input listeners
        [creditsInput, perCreditInput, trimesterFeeInput, scholarshipSelect, thesisCreditsSelect, retakeCreditsInput, degreeTotalCreditsInput, degreeCompletedCreditsInput].forEach(el => {
            if (el) {
                el.addEventListener('input', calculate);
                el.addEventListener('change', calculate);
            }
        });

        // Sync button
        btnSyncFromCgpa.addEventListener('click', syncFromCgpa);

        // Print Statement button
        const printBtn = document.getElementById('btnPrintTuitionReceipt');
        if (printBtn) printBtn.addEventListener('click', () => window.print());

        // Initial calculation
        calculate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
