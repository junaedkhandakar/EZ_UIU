/**
 * EZ_UIU - Verified UIU Knowledge Base for RAG
 *
 * Every clause below was transcribed from an official UIU source and checked
 * against that source. Each entry keeps:
 *   - the exact document title (what a student should look for),
 *   - the canonical URL of the page or PDF it came from,
 *   - the verification date of that check.
 *
 * `verified` is a date string (YYYY-MM), not a boolean, so the UI can show how
 * recent the check was and a stale clause is visible rather than silent.
 *
 * Where UIU publishes no rule (for example convocation Latin honours
 * thresholds), no clause is written. The advisor says so and names the office
 * that decides it, instead of inventing a number.
 *
 * Sources
 *   GRADING    https://www.uiu.ac.bd/academics/grading/
 *   PROBATION  https://www.uiu.ac.bd/academics/probation-policy/
 *   POLICIES   https://www.uiu.ac.bd/academics/academic-information-policies/
 *   WAIVER     https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/scholarship-tuition-fee-and-other-fees-waiver-policy/
 *   FEES       https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/
 *   PAYMENT    https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/payment-policies/
 *   CALENDAR   https://www.uiu.ac.bd/academics/calendar/
 *   CURRICULUM https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2026/04/BSCSE_Curriculum__UIU_2026.pdf
 *   FYDP       https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2025/09/FYDP_Handbookv1_FINAL.pdf
 *   OFFERINGS  https://cse.uiu.ac.bd/notice/course-offerings-bscse-fall-26/
 */

/**
 * A single retrievable clause.
 * `id`         stable identifier, used by the UI for deep links
 * `title`      human label shown in citations
 * `category`   grouping used by the knowledge base browser
 * `source`     issuing authority / document name
 * `url`        canonical link to the official page or PDF
 * `content`    the clause text, written as it appears in the source
 * `keywords`   extra retrieval terms that do not appear in the clause text
 * `verified`   month of the last manual check against the official source
 */
export const UIU_KNOWLEDGE_DOCUMENTS = [
  {
    id: 'kb_grading_scale',
    title: 'Grading & Performance Evaluation',
    category: 'Academic Evaluation',
    source: 'UIU Grading & Performance Evaluation',
    url: 'https://www.uiu.ac.bd/academics/grading/',
    verified: '2026-11',
    summary:
      'Official UIU letter grade scale, grade points, GPA/CGPA calculation, earned credit, incomplete grade and retake rules.',
    keywords: [
      'grade',
      'grade point',
      'marks',
      'percentage',
      'gpa',
      'cgpa',
      'transcript',
      'credit hour',
      'earned credit',
      'letter grade',
      'outstanding',
      'fail',
      'pass',
    ],
    content: `Grading System
The performance of a student in a given course is made through continuous evaluation that comprises quizzes/in-course tests, class participation, attendance, homework/assignment, case study, mid-terms and trimester final examinations. Letter grades and grade points are used to evaluate the performance of a student in a given course.

Letter Grade | Grade Point | Marks (%) | Assessment
A (Plain) | 4.00 | 90 - 100 | Outstanding
A- (Minus) | 3.67 | 86 - 89 | Excellent
B+ (Plus) | 3.33 | 82 - 85 | Very Good
B (Plain) | 3.00 | 78 - 81 | Good
B- (Minus) | 2.67 | 74 - 77 | Above Average
C+ (Plus) | 2.33 | 70 - 73 | Average
C (Plain) | 2.00 | 66 - 69 | Below Average
C- (Minus) | 1.67 | 62 - 65 | Poor
D+ (Plus) | 1.33 | 58 - 61 | Very poor
D (Plain) | 1.00 | 55 - 57 | Pass
F | 0.00 | 0 - 54 | Fail

Calculation of GPA/CGPA
Term Grade Point Average (GPA) is the weighted average grade of a Trimester/Semester. Cumulative Grade Point Average (CGPA) is the weighted average of the grade points obtained in all the courses completed by the student.
GPA = sum(Gi x Ci) / sum(Ci)
CGPA = sum(Gi x Ci) / sum(Ci), where C = credits of the ith course, G = grade point earned in the ith course, n = number of courses taken in the Trimester/Semester, N = number of courses taken up to the last Trimester/Semester.

Earned Credit Hours
The course in which a student has obtained "D" or higher grade will be counted as earned credit hours. Any course in which a student has obtained "F" grade will not be counted towards his/her earned credit. In that case he/she will have to retake the course.

Incomplete (I)
Incomplete (I) grade may be assigned in special circumstances at the discretion of course teacher. The student has to take the initiative to remove the "I" grade within 15 days of the following trimester. If action is not taken, the "I" grade will revert to "F".

Retaking a course (R)
Students may select to retake a course if he or she thinks grade improvement is possible. Students who wish to retake a course must register for the course again and will have to pay tuition and other applicable fees.

Degree requirements for both Undergraduate and Graduate Programs: CGPA 2.00.`,
  },

  {
    id: 'kb_probation_policy',
    title: 'Academic Probation Policy (2025)',
    category: 'Academic Standing',
    source: 'UIU Probation Policy 2025',
    url: 'https://www.uiu.ac.bd/academics/probation-policy/',
    verified: '2026-11',
    summary:
      'CGPA threshold for probation, notice limits, dismissal rules, registration caps, UCAM lock and department-change ban.',
    keywords: [
      'probation',
      'dismissal',
      'suspended',
      'warning',
      'low cgpa',
      'gpa below 2',
      'credit cap',
      'registration limit',
      'minimum credits',
      'third probation',
      'term gpa',
      'undertaking',
      'special consideration',
    ],
    content: `UIU Probation Policy 2025 (reintroduced from Spring 2025)
For students of both undergraduate and graduate programs, the minimum CGPA requirement for acceptable academic standing will be 2.0, which is also the minimum requirement (final CGPA of 2.0) for obtaining a degree from UIU. If a student's CGPA falls below 2.0 at any time, he/she will be placed on academic probation.

Undergraduate students, who have completed less than 60 credits, will be served with maximum three probation notices in consecutive trimesters/semesters (once in a trimester/semester) to come out of the state of probation. If such students fail to raise their CGPA to the level of 2.0 within the given time period, they will be dismissed from the respective Program. However, if a student achieves a term GPA of 2.0 or more in the 3rd probation-trimester/semester without achieving CGPA of 2.0, s/he will be allowed to continue his/her probation, on special consideration, as long as s/he maintains a term GPA of 2.0 or more. During this extended period of probation, if his/her term GPA falls below 2.0 at any point of time, he/she will be dismissed from the Program.

Undergraduate students, who have completed 60 credits or more, will also be served with three probation notices in consecutive trimesters/semesters with the same third-probation and dismissal rules. Additionally, if deemed necessary by the concerned department/program, such a student may be kept on continued probation until s/he achieves a term GPA/CGPA of 2.0; in such special occasions, the concerned department/program will be required to place such exceptional cases to the Academic and Admin Committee, along with justification(s), for the Committee's consideration.

Graduate students, who have completed less than 15 credits, will be served with maximum three probation notices. Graduate students, who have completed 15 credits or more, will also be served with three probation notices, with the same special-consideration and dismissal rules.

For undergraduate programs, students on probation must register minimum two courses (6 credits) in a trimester and three courses (9 credits) in a semester. The maximum allowable credit hours for a student under probation will be determined by the respective Program, on a case by case basis.

For all students on probation, pre-advising and registration in UCAM will remain centrally locked. They will be mandatorily required to contact their respective advisor for pre-advising and registration. After due counseling, the advisor will unlock the UCAM for completing the pre-advising and registration.

Undergraduate students on probation, as well as their parents/guardians, will be notified via email and SMS/text messages after publication of the results of the final examination in each Trimester/Semester. In the case of graduate students placed on probation, only the students will receive the notifications.

Students on third probation will have to provide undertaking on a prescribed form at the time of registration to formally record the student's declaration acknowledging his/her current academic status and understanding of the associated consequences. The document must be duly signed by the student, and it will also require the acknowledgement from his/her parent or legal guardian.

If a student comes out of probation (i.e. achieves CGPA of 2.0 or above) after one/two/three or more probation notices, his/her subsequent probation(s), if any, will be counted anew, i.e. earlier probations will not be counted towards the new probation while issuing another set of maximum three or more probation notices on each occasion.

Department change will not be allowed for a student in probation. A student, who was dismissed from a department/program, may be readmitted to UIU through regular admission test and will be treated as a new student. Course waiver in such cases will be allowed, if applicable, provided the student had achieved a minimum grade of 'C' or above in the same or equivalent courses previously.

All students on probation will have to attend all student-support programs (special counseling, special classes, tutorial classes, mentoring, etc.) that the university may undertake from time to time on a mandatory basis. Students violating such instructions will not be served with more than three probation notices and will be dismissed after the 3rd probation notice if s/he does not achieve the CGPA of 2.0.

All students, irrespective of their probation status/history, must obtain a final CGPA of at least 2.0 in order to receive the degree. UIU Probation Policy 2025 is applicable for all existing students of UIU, irrespective of their admission trimester/semester, as well as for all the new students to be admitted onwards.`,
  },

  {
    id: 'kb_merit_scholarship',
    title: 'Merit Scholarship on Trimester Results',
    category: 'Financial Aid',
    source:
      'UIU Scholarship, Tuition and Other Fees, Waiver Policy (effective Spring 2025), item 04',
    url: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/scholarship-tuition-fee-and-other-fees-waiver-policy/',
    verified: '2026-11',
    summary:
      'Merit scholarship bands by rank, 3.50 GPA condition, 9-credit registration floor, and the credit-parity note.',
    keywords: [
      'merit',
      'scholarship',
      'waiver',
      'top 2%',
      'next 4%',
      'top 10%',
      'gpa 3.50',
      '100% waiver',
      '50% waiver',
      '25% waiver',
      'rank',
      'tuition fee waiver',
      'result based',
    ],
    content: `Scholarship based on trimester/semester results (Undergraduate and Graduate) - Tuition fee only

Eligibility: based on the results of the just-previous trimester/semester, with a minimum GPA of 3.50:
a. Top 2% of the total students of a particular program (in order of merit): 100%
b. Next 4% in that particular program (in order of merit): 50%
c. Next 4% in that particular program (in order of merit): 25%

Top 10% students are eligible to get 25% to 100% scholarship.

Credit registration requirement for undergraduate students: students must register a minimum number of credits in the qualifying trimester/semester, including in the first trimester/semester:
A. BBA, BBA in AIS, BSECO: 09 credits
B. BSCSE, BSEEE, BSDS: 09 credits
C. B.Sc. in CE: 09 credits
D. BSSEDS, BSSMSJ, BA in English: 09 credits
E. B. PHARM: 14 credits
F. BSBGE: 09 credits

Credit registration requirement for graduate students: minimum 06 (six) credits in the qualifying trimester/semester.

Grade requirement: a minimum GPA of 3.50 must be obtained to be considered for this scholarship. A student will not qualify for merit scholarship if s/he does not have the GPA of 3.50 even if s/he remains in the top 10% of the program in the qualifying trimester/semester.

Note: an eligible student receives scholarship in the 2nd and following trimesters/semesters only for the equal number of credits, based on whose result the scholarship is being awarded, in the following/scholarship-receiving trimester/semester, if s/he registers for more credits. If the student registers for fewer credits in the scholarship-receiving trimester/semester, s/he receives scholarship only for the credits registered in that trimester/semester.

Other conditions: this scholarship is not applicable for Thesis, Project, Internship, Retake and Repeat courses.`,
  },

  {
    id: 'kb_waiver_conditions',
    title: 'Waiver Conditions, Stacking and Exclusions',
    category: 'Financial Aid',
    source:
      'UIU Tuition Fees & Waivers / Scholarship, Tuition and Other Fees, Waiver Policy (effective Spring 2025)',
    url: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/',
    verified: '2026-11',
    summary:
      'Best-one-only stacking rule, 50% first-retake waiver, thesis/project/internship exclusion, and the I-grade scholarship forfeiture.',
    keywords: [
      'stack',
      'combine waivers',
      'retake fee waiver',
      'repeat fee',
      'improvement exam',
      'incomplete grade scholarship',
      'gold medal',
      'best one',
      'conditions and rules',
    ],
    content: `Conditions and rules applied during the calculation of scholarship or tuition fee waiver

- Students entitled to both scholarships (based on trimester/semester exam result) and waivers (academic or non-academic) will be allowed to avail only the best one from among the scholarships and waivers. Waivers do not stack.
- Students who apply for an "I" grade or take an improvement exam in a particular trimester/semester will not be eligible for any UIU scholarship in the following trimester/semester. Additionally, students who have appeared for an improvement exam may not be eligible for the Gold Medalist award.
- Course fee for each retake/repeat will be waived by 50%, only for the first time.
- Tuition fee waiver/scholarship is not applicable for Thesis/Project/Internship/Retake and Repeat courses.
- UIU reserves the right to change the policies, fees, curricula, or any other matters without any prior notice.`,
  },

  {
    id: 'kb_waiver_categories',
    title: 'Non-Academic Waiver Categories',
    category: 'Financial Aid',
    source:
      'UIU Scholarship, Tuition and Other Fees, Waiver Policy (effective Spring 2025), Waivers section',
    url: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/scholarship-tuition-fee-and-other-fees-waiver-policy/',
    verified: '2026-11',
    summary:
      'Full list of official non-academic waivers with their percentage, eligibility and continuing GPA condition.',
    keywords: [
      'sibling waiver',
      'freedom fighter',
      'disabled',
      'ethnic group',
      'tribal',
      'underdeveloped region',
      'poor student',
      'alumni',
      'employee waiver',
      'diploma',
      'foreign student',
      'bot fund',
    ],
    content: `Waivers (Non-Academic) - effective from Spring 2025 until further order

01. Meritorious and Poor Students from Underdeveloped Regions of Bangladesh - 100% tuition and other fees waiver (3% of admitted students). Academic requirement (70% weightage): HSC GPA 5.00 with or without 4th subject, or Five (5) A in O-level and One (1) A in A-level. Insolvency requirements (30% weightage) with TIN of parent/guardian. Residency in an Upazilla classified as "Very High Poverty Level" by the Bangladesh Bureau of Statistics. Continuing GPA 3.00. Not applicable for Admission Fee, ID card caution money, Thesis, Project, Internship, and Retake and Repeat courses.

02. Freedom Fighters' Children - 100% tuition and other fees waiver (3% of admitted students). Student must be a ward of a Freedom Fighter as defined by the Government of Bangladesh, with government-approved documentary evidence. Continuing GPA 2.50. Not applicable for Admission Fee, ID card fee, Thesis, Project, Internship, and Retake and Repeat courses.

03. Ethnic Groups and Tribal Communities - 25% tuition fee. Student must be a member of a government-gazetted small ethnic or tribal group, including from the Chittagong Hill Tracts, with documentary evidence. Continuing GPA 3.00. Not applicable for Thesis, Project, Internship, and Retake and Repeat courses.

04. Physically Disabled Students - 25% to 50%. Applicants classified with physical disability under "Light" category are not eligible. Moderate disability receives 25%; severe disability receives 50%. Continuing GPA 3.00. Not applicable for Thesis, Project, Internship, and Retake and Repeat courses.

05. Sibling/Spouse Tuition Fee Waiver - 20%. Documentary evidence must be submitted; both the siblings/spouse must register courses in the same trimester/semester. Continuing GPA 3.00.

06. Siblings of UIU alumni - 20%. The UIU alumni must be a member of the Association of UIU Alumni (AUIUA). Continuing GPA 3.00.

07. UIU Alumni (Graduate) - 25%. Continuing GPA 3.00.

08. Bangladesh Government Employees (Graduate) - 25%. Eligible as long as s/he remains an employee of the Government of Bangladesh. Continuing GPA 3.00.

09. Group/Corporate Employees (Graduate) - 25%. At least two employees from the same group/corporate must be admitted in the same trimester/semester. Continuing GPA 3.00.

10. UIU Employees (Graduate) - 40%. Eligible as long as s/he remains a UIU employee. Continuing GPA 3.00.

11. Immediate Family Members of UIU Employee (spouse and children) - 40%. The employee must have served UIU as a regular employee for at least three years. Continuing GPA 3.00.

12. UIU Ex-Employees' Immediate Family Members (spouse and children) - 40%. The ex-employee must have served UIU for at least fifteen years. Continuing GPA 3.00.

13. United Group Employees (Graduate) - 40%. A maximum of five UG employees can take admission in a particular trimester/semester, first-come first-served basis. Continuing GPA 3.00.

14. Foreign Students - 25%. Continuing GPA 2.00.

15. UIU-PGDHRM Diploma-holders enrolling for MBA (Graduate) - 25%. Continuing GPA 3.00.

16. Financial Aid from the BoT Fund for Needy Students (Undergraduate) - minimum GPA 2.50 in the previous trimester/semester; in extraordinary circumstances the GPA must not be below 2.00. Generally only students who have completed at least half of the required credits are considered, and the aid applies for a single running trimester/semester only.

Academic scholarships at admission (items 01-03 of the same policy):
- Bangla Medium/English Version (HSC based): GPA 5.00 in SSC with 4th subject and GPA 5.00 in HSC without 4th subject gives 50%; GPA 4.50 in SSC with 4th subject and GPA 5.00 in HSC with 4th subject gives 25%.
- English Medium (O-Level and A-Level): Five A in O-Level and Two A in A-Level gives 50%; Five A in O-Level and One A in A-Level gives 25%.
- Graduate (based on previous results): undergraduate GPA 3.50 on a 4.00 scale plus HSC GPA 4.50 on a 5.00 scale, or two First Class/Divisions in undergraduate and HSC, gives 25%.
- Scholarship for Talented Programmers (once only): top ten positions in a listed nationally or internationally recognized competition (IOI, IMO, IPhO, NCPC, BIO, BdMO, BDPhO) gives 100%; positions 11 to 30 give 75%; qualified participation gives 50%.
- Special Scholarship for foreign students from selected countries - 100% (Bhutan, India, Maldives, Nepal, Palestine, Sri Lanka and Turkiye), exempting admission form fee, admission fee, ID card caution money, trimester/semester fee, tuition fee, thesis/internship/project fee, and transcript/certificate fee. Continuing GPA 2.00. The exemption is not applicable for Retake courses.
- Students with a four-year Technical Board diploma - 25%, continuing GPA 3.00.`,
  },

  {
    id: 'kb_tuition_fees',
    title: 'Tuition Fees & Payment Schedule',
    category: 'Financial Aid',
    source: 'UIU Tuition Fees & Waivers',
    url: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/',
    verified: '2026-11',
    summary:
      'Per-credit fee, trimester fee, program credit totals, admission and caution money, and the 40/30/30 installment split.',
    keywords: [
      'tuition',
      'fee',
      'per credit',
      'cost',
      'installment',
      'payment',
      '6500',
      '5525',
      'trimester fee',
      'admission fee',
      'caution money',
      'lab fee',
      'program total',
    ],
    content: `Admission and other fees (included in the above fees)
- Admission fee Tk. 20,000/- (non-refundable) as down payment during admission.
- Caution money for ID Card Tk. 2,000/- (refundable) payable at the time of taking Admission.
- Per Trimester Fee Taka 6,500/- and Per Semester Fee Taka 9,750/- (B. Pharm).
- BSBGE students are required to pay a laboratory fee of Tk. 2,000/- per trimester, while B. Pharm students must pay a laboratory fee of Tk. 5,000/- per semester; both fees are included in the total tuition fees.

Fee calculation
Tuition fee in each Trimester = Number of Credits Taken x Per Credit Fee + Trimester Fee (Tk. 6,500/-)
Tuition fee in each Semester (For B. Pharm) = Number of Credits Taken x Per Credit Fee + Semester Fee (Tk. 9,750/-)

Installments
- Students would be required to pay an amount of Tk. 20,000/- as partial payment of tuition fees before registration of courses in each trimester/semester.
- Trimester-based students will have to pay the rest of their tuition and trimester fee in three installments at 40%, 30% and 30% rates respectively.
- While the Semester-based students will pay it in four equal installments at 25% rate.

Program totals (Undergraduate)
BBA: 125 credits, 6500 per credit, 12 Trimester. BBA in AIS: 125 credits. BSECO: 122 credits. BSSEDS: 123 credits.
BSCSE: 141 credits, 6500 per credit, 12 Trimester. BSDS: 138 credits. BSEEE: 140 credits. BSc Civil: 151.5 credits.
B. Pharm: 160 credits, 8 Semester. BA English: 123 credits at 5525 (15% discount). BSSMSJ: 130 credits at 5525 (15% discount). BSBGE: 140 credits.

Graduate programs
MBA 60 credits over 6 terms. EMBA 45 credits over 5 terms. MSECO 30 credits over 4 terms. MDS 39 credits over 4 terms. MSCSE 36 credits over 4 terms.

UIU reserves the right to change the policies, fees, curricula, or any other matters without any prior notice.`,
  },

  {
    id: 'kb_payment_policy',
    title: 'Payment, Drop & Refund Policy',
    category: 'Financial Aid',
    source: 'UIU Payment Policies',
    url: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/payment-policies/',
    verified: '2026-11',
    summary:
      'Course fee deadline, late fee, enrollment cancellation, and the 100% adjustable refund window for dropped courses.',
    keywords: [
      'late fee',
      'drop course',
      'refund',
      'deadline',
      'cancel enrollment',
      'financial obligation',
      'payment deadline',
      '500',
    ],
    content: `Payment Policy
Students who enroll at UIU assume the responsibility of paying tuition and other fees in accordance with the following financial policies:
- Admission fee is non-refundable and is due at the time of admission.
- Caution money for ID Card Tk. 2,000 (Refundable) is payable at the time of taking admission.
- Course fee is due to be paid within the stipulated deadline of a trimester/semester. Students failing to pay their course fee in time will have to pay a late fee (details obtainable from the Registrar's Office).
- University authority reserves the right to cancel the enrollment/admission of any student failing to meet the financial obligation.

Course Drop and Refunds
Dropping of courses can be done with 100% adjustable refund of tuition fees within the dates mentioned in the Academic Calendar.`,
  },

  {
    id: 'kb_registration_policies',
    title: 'Registration, Advising & Minimum Credit Load',
    category: 'Academic Evaluation',
    source: 'UIU Academic Information Policies',
    url: 'https://www.uiu.ac.bd/academics/academic-information-policies/',
    verified: '2026-11',
    summary:
      'Registration formalities, late registration fine, add-drop window, minimum 9-credit registration floor, and advising rules.',
    keywords: [
      'register',
      'registration',
      'advising',
      'minimum credits',
      '9 credits',
      '6 credits',
      'add drop',
      'late registration',
      'fine',
      'ucam',
      'pre-advising',
    ],
    content: `Registration
Students are required to complete their registration formalities before a trimester starts. The Admission Office will notify newly admitted students about the time and place of registration. Students should consult their course advisors for planning their courses and to be familiar with UIU policies and procedures related to registration. Students can register online.

Late Registration and Add-Drop of Courses
A student seeking to register after the scheduled date has to take permission of the concerned respective Head of the Department. A student given permission to register late has to pay a late registration fee. A student may drop course(s) only within the date mentioned in the Academic Calendar with the approval of the Head of the department. The last day of dropping a course in a trimester without a record (i.e., "W") in the transcript is mentioned in the academic calendar.

Students' Advising
Faculty Advisors, prior to registration, will advise students of the undergraduate and graduate programs. Students of undergraduate programs have to register a minimum of 9 (nine) credits and graduate students a minimum of 6 (six) credits in a single Trimester.

Department/Program change
Heads of Departments/Programs will dispose of the issues relating to acceptance of the grade(s) of the students changing their Departments/Programs. Department change will not be allowed for a student in probation.`,
  },

  {
    id: 'kb_attendance_policy',
    title: 'Minimum Attendance in the Class',
    category: 'Academic Evaluation',
    source: 'UIU Academic Information Policies',
    url: 'https://www.uiu.ac.bd/academics/academic-information-policies/',
    verified: '2026-11',
    summary: '80% minimum class attendance requirement to be eligible for the final examination.',
    keywords: ['attendance', 'absent', '80%', 'debarred', 'final exam eligibility', 'present'],
    content: `Minimum Attendance in the Class
Students are expected to attend classes regularly. A student would be required to attend at least 80% of classes in every course in order to sit for the Final Exam.`,
  },

  {
    id: 'kb_withdraw_incomplete',
    title: 'Withdrawal, Incomplete Grade & Grade Change',
    category: 'Academic Evaluation',
    source: 'UIU Academic Information Policies',
    url: 'https://www.uiu.ac.bd/academics/academic-information-policies/',
    verified: '2026-11',
    summary:
      'W-grade withdrawal process and non-refund, the 15-day I-grade conversion to F, and the one-week grade-change window.',
    keywords: [
      'withdraw',
      'w grade',
      'incomplete',
      'i grade',
      'grade change',
      'reconsideration',
      'drop semester',
      'medical',
      '7th day',
      '15 days',
    ],
    content: `Withdrawal of Course(s)
Students wishing to "Withdraw" any course due to sickness or other unavoidable circumstances must collect a form for a "W" grade from the Program Office. Students have to collect signature(s) for endorsement of the respective course teacher(s) and submit it to the concerned Head of the Department for final approval. The duly approved application must be submitted to the Registrar's Office within 7th day of the ending of the Mid-Term II Exam. Tuition fees for the withdrawn course(s) will not be refunded.

"I" (Incomplete) Grade
The "I" (Incomplete) grade is granted only in exceptional cases and may be assigned to students in special circumstances after Mid-Term Exam. Students will collect the form from the Exam Controller's Office/Departmental Office. After filling up the forms, students will collect signature(s) for endorsement of the respective course teacher(s) and then they will submit the forms to the respective Head of the Department for final approval. A student must appear in the Exam in which he/she is given an "I" grade within 15 (fifteen) days from the beginning of classes of the following Trimester, otherwise "I" will turn into "F" automatically. In case of absence of concerned course teacher from whom a student receives an "I" grade, the disposition of the case involving "I" (Incomplete) grade(s) resides with the concerned Head of the Department. Students applying for "I" (Incomplete) Grade in a particular Trimester would not be eligible for any Scholarship Scheme of UIU for the corresponding Trimester.

Reconsideration of Grade Change Policy
A student has to apply for grade change of a course to the concerned Head/Director/Coordinator of the Dept./Program within 1 (one) week of the beginning of the classes of the following Trimester. The concerned Head/Director/Coordinator has to complete the formalities within 3 (three) days of receiving the application and submit it to the office of the Controller of Examinations.

Trimester Drop
A student may drop a Trimester only on medical grounds or other valid reasons, applying in writing to the Registrar through the Head of the Department. If the case is found genuine by the authorities, the student may be allowed to drop the current Trimester after making payment of 50% of Tuition Fee, Trimester Fee and Transport Fee (if applicable). However, if an additional amount is deposited against payment of tuition fees, the amount would no way be refunded; it will only be adjusted with the tuition fees to be payable in the next Trimester.`,
  },

  {
    id: 'kb_retake_policy',
    title: 'Repeat & Retake of Courses',
    category: 'Academic Evaluation',
    source: 'UIU Academic Information Policies',
    url: 'https://www.uiu.ac.bd/academics/academic-information-policies/',
    verified: '2026-11',
    summary:
      'F-grade repeat requirement, retake for grade improvement, 100% fee payment, and the "R" mark on the transcript.',
    keywords: [
      'repeat',
      'retake',
      'improvement',
      'f grade repeat',
      'r mark',
      'transcript mark',
      'resit',
      'backlog',
    ],
    content: `Repeat & Retake of Course(s)
A student obtaining "F" grade in any course in any Trimester will have to "Repeat" the course with full payment of tuition fee for that particular course. Students desiring to improve their grade(s) may again take up course(s) which are termed as "Retake". Such students will also have to make payment of 100% tuition fee for retaking a course. Students would not be entitled to scholarship/tuition fee waiver for "Repeat/Retake" course(s). Repeating a particular course or courses as well as retaking a particular course or courses by a student, the names of such repeated or retaken courses would be shown on his/her Transcript as 'R'.

Note from the Tuition Fees & Waivers policy: course fee for each retake/repeat will be waived by 50%, only for the first time.

Note from the Grading policy: "Retaking a course (R). Students may select to retake a course if he or she thinks grade improvement is possible. Students who wish to retake a course must register for the course again and will have to pay tuition and other applicable fees."`,
  },

  {
    id: 'kb_self_study',
    title: 'Self-Study System',
    category: 'Academic Evaluation',
    source: 'UIU Academic Information Policies',
    url: 'https://www.uiu.ac.bd/academics/academic-information-policies/',
    verified: '2026-11',
    summary:
      'Self-study eligibility (only when 20 credits remain), the six-student cap, and automatic F for incomplete self-study courses.',
    keywords: ['self study', 'self-study', '20 credits', 'independent study', 'home study'],
    content: `Self-Study System
A student can take course(s) under the Self-Study System if only 20 credits out of the total credits remain to be completed. A student will not be allowed to take a course under the self-study system if that course is offered by the department in that particular trimester. The maximum number of students shall not exceed 6 (six) in a particular course under the Self-Study System. The courses taken under the Self-Study System should be completed within the trimester in which the registration of courses has been made. If the courses are not completed within the scheduled trimester, concerned students will be given an "F" grade for the respective Self-Study courses.`,
  },

  {
    id: 'kb_degree_completion',
    title: 'Period of Time for Degree Completion',
    category: 'Academic Standing',
    source: 'UIU Academic Information Policies',
    url: 'https://www.uiu.ac.bd/academics/academic-information-policies/',
    verified: '2026-11',
    summary: 'Maximum and minimum time allowed to complete undergraduate and graduate degrees.',
    keywords: ['time limit', 'maximum years', 'minimum years', 'duration', 'completion period', '7 years'],
    content: `Period of Time for Completion of Degree
Maximum Time Period for Completion of Undergraduate and Graduate Programs:
- Undergraduate Programs: 7 years
- Graduate Programs: 5 years

Minimum Time Period for Completion of Undergraduate and Graduate Programs:
- Undergraduate Programs: Regular Students: 3 (three) Years; Credit Transferred Students: 2 (two) Years
- Graduate Programs: 1 (one) Year`,
  },

  {
    id: 'kb_unfair_means',
    title: 'Punishment for Unfair Means',
    category: 'Academic Standing',
    source: 'UIU Academic Information Policies',
    url: 'https://www.uiu.ac.bd/academics/academic-information-policies/',
    verified: '2026-11',
    summary: 'Escalating punishments for unfair means at class test, mid-term and final examination.',
    keywords: ['cheating', 'unfair means', 'expulsion', 'misconduct', 'plagiarism'],
    content: `Punishment for adopting Unfair Means
1. Adopting unfair means for the 1st Time:
   i. Class Test: Course Expulsion
   ii. Mid-term or Final Exam: Trimester/Semester Expulsion
2. Adopting unfair means for the 2nd Time:
   i. Class Test: Course Expulsion and Warning Letter
   ii. Mid-term or Final Exam: Trimester/Semester Expulsion and Warning Letter
3. Adopting unfair means for the 3rd Time:
   i. Class Test: Permanent Expulsion from UIU
   ii. Mid-term or Final Exam: Permanent Expulsion from UIU`,
  },

  {
    id: 'kb_bscse_degree_requirements',
    title: 'B.Sc. CSE Degree Requirements & Curriculum',
    category: 'Curriculum',
    source: 'UIU CSE Department, BSCSE Curriculum (Summer 2026 onwards)',
    url: 'https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2026/04/BSCSE_Curriculum__UIU_2026.pdf',
    verified: '2026-11',
    summary:
      'Degree requirements, the 141-credit total, the credit group breakdown, and the four-course specialization rule.',
    keywords: [
      '141 credits',
      '138 credits',
      'degree requirement',
      'curriculum',
      'specialization',
      'major',
      'elective credits',
      'credit groups',
      'summary of courses',
    ],
    content: `B.Sc. in CSE Degree Requirements
(a) Completion of 141.0 credit hours (Summer 2026 onwards curriculum)
(b) Completion of the final year design project with at least a 'C' grade
(c) Passing of all courses individually and maintaining a minimum CGPA of 2.0

Students of previous batches follow the Spring 2023 to Spring 2026 curriculum, which requires Completion of 138.0 credit hours, with the same FYDP and minimum CGPA conditions.

Specialization
A specialization will be declared in one of the following areas if at least four courses are completed from the elective courses: AI & Data Science, Software Engineering, Network & Cybersecurity, Embedded System & Robotics, and Business System Engineering. (The Spring 2023 to Spring 2026 curriculum requires at least three courses and offers computational theory, communication, hardware, systems, software, data science, and Information and Communication Technology.)

Summary of Courses (Summer 2026 onwards)
1. Language: 6.0
2. General Education: 17.0 (Compulsory 8.0 - SOC 2101, PMG 4101, BDS 1201; Optional any three: 9.0)
3. Basic Sciences: 7.0 (Theory 6.0, Laboratory 1.0)
4. Mathematics: 12.0
5. Other Engineering: 10.0 (Theory 9.0, Laboratory 1.0)
6. Core/Compulsory Courses: 68.0 (Theory 54.0, Laboratory 14.0)
7. Elective Courses: 15.0 (Any five)
8. Final Year Design Project: 6.0
Total: 141.0 (Theory 119.0, Laboratory 16.0, FYDP 6.0)

Credit distribution across the twelve trimesters
T1: 9.0 | T2: 10.0 | T3: 11.0 | T4: 11.0 | T5: 13.0 | T6: 11.0 | T7: 11.0 | T8: 12.0 | T9: 13.0 | T10: 12.0 | T11: 14.0 | T12: 14.0 | Total 141.0`,
  },

  {
    id: 'kb_fydp_policy',
    title: 'Final Year Design Project Policies',
    category: 'Curriculum',
    source:
      'UIU CSE Department, Final Year Design Project Policies and Procedures (v1.0, 16 September 2025)',
    url: 'https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2025/09/FYDP_Handbookv1_FINAL.pdf',
    verified: '2026-11',
    summary:
      'The 85-credit FYDP-I gate, group size, supervisor quota, assessment split, and the mandatory C grade in each FYDP part.',
    keywords: [
      'fydp',
      'thesis',
      'capstone',
      '85 credits',
      '80 credits',
      'supervisor',
      'mentor',
      'group size',
      'project registration',
      'plagiarism',
      'final report',
      'weekly report',
    ],
    content: `Final Year Design Project (FYDP) Requirements
The FYDP is done in three parts: FYDP-I, FYDP-II and FYDP-III. Students will select a supervisor who will offer guidance at which students will meet on a weekly or monthly basis. For a particular semester, under normal conditions, each supervisor can usually take a maximum of 3 (three) new FYDP-I groups (recommended limit) to supervise. A supervisor may also take 1 (one) more group to jointly supervise or co-supervise with another supervisor, and a co-supervision task is considered a half load of supervision. A student's FYDP group can have a maximum of 5 students and a minimum of 3 students. The Supervisor and Course Teacher are different individuals: the Supervisor supervises the FYDP for all three parts, while the Course Teacher conducts the FYDP-I course. A Course Teacher of a section cannot be the Supervisor/Mentor for any group attending the same section's classes.

Project Code and Key Information
Course Codes: CSE 4000A, CSE 4000B, CSE 4000C. CSE 4000A (FYDP-I) is a pre-requisite of CSE 4000B (FYDP-II) and CSE 4000C (FYDP-III). Total Credit Hours: 2.0 + 2.0 + 2.0 = 6.0. In each course, a student must get at least a C grade!

Pre-requisites (2.1)
The Final Year Design Project is restricted to 4th year students only. Therefore, at least 85 Credits or above must be completed before taking FYDP-I (i.e., within the previous semester, for the semester when FYDP-I is to be taken). In addition, students must also have completed the core course that is directly related to the project area.

Procedures to Participate
Eligible students may form their groups and contact any potential supervisor/mentor. Based on the agreement among them, a topic can be chosen and then the FYDP can be enrolled under that supervisor/mentor. It is generally not expected that the department assigns a supervisor/mentor unless all other supervisors/mentors have reached their maximum allowed quota of groups.

Weekly Report
While attending the FYDP-I course, each student is required to submit a Weekly Report or Weekly Journal to the Course Teacher, signed by the mentor. All submitted weekly reports will be collated as a single report book at the end of the semester.

Final Report
A student is required to submit the FINAL FYDP report at the end of FYDP-III. Failure to submit the FINAL report may lead to a Fail ('F') grade in this course. The FINAL report must be printed with at least 3 copies: one for the Supervisor/Mentor, one for the Examiner or Course Teacher, and one for the department.

Assessment
FYDP-I (CSE 4000A): total 100 marks - Supervisor or Mentor 40, Teacher or Examiner 60.
FYDP-II (CSE 4000B): total 100 marks - Supervisor or Mentor 35, Teacher or Examiner 65.
FYDP-III (CSE 4000C): total 100 marks - Supervisor or Mentor 30, Teacher or Examiner 70.

Plagiarism and AI-generated text
Suspected or proven plagiarism results in a detailed investigation by the department; students caught with plagiarism may be penalized heavily and shall not be able to pass the course. Students are strongly advised not to use any AI-tool for text generation, and AI-generated text and word spinners are prohibited. If an AI-powered tool is used for language correction and polishing, there must be a clear declaration and the similarity percentage must not exceed 5%.`,
  },

  {
    id: 'kb_exam_slots',
    title: 'Final Examination Slots',
    category: 'Examinations',
    source:
      'UIU CSE Department, Course Offerings For B.Sc. in CSE / B.Sc. in Data Science',
    url: 'https://cse.uiu.ac.bd/notice/course-offerings-bscse-fall-26/',
    verified: '2026-11',
    summary:
      'How final examinations are scheduled across days and slots, and how the auditor detects same-slot collisions.',
    keywords: [
      'exam slot',
      't1',
      't2',
      't3',
      'exam day',
      'exam time',
      'clash',
      'collision',
      'final exam schedule',
      'course offerings',
    ],
    content: `Final Examination Slots
UIU schedules trimester final examinations in three slots across seven exam days. Each course published in the Course Offerings notice carries an "Exam Day" and an "Exam Slot" value. Laboratory courses are published with "N/A" for both, because they have no final written examination.

Slot T1 - morning
Slot T2 - mid-day
Slot T3 - afternoon

Each trimester publishes its own Course Offerings notice with the authoritative Exam Day and Exam Slot for every offered course, and separately an Exam Routine notice with the full date-wise schedule. The Schedule Auditor in this app reads the Exam Day and Exam Slot columns from the Course Offerings data and flags two courses that share the same exam day and the same exam slot, because a candidate cannot sit two examinations in one slot.

Always check the Course Offerings and Exam Routine notices published by the Department of CSE for the current trimester, because the day and slot assignment changes from trimester to trimester.`,
  },

  {
    id: 'kb_calendar_and_deadlines',
    title: 'Academic Calendar & Key Deadlines',
    category: 'Examinations',
    source: 'UIU Academic Calendar',
    url: 'https://www.uiu.ac.bd/academics/calendar/',
    verified: '2026-11',
    summary:
      'Which deadlines are fixed by the Academic Calendar each trimester, and where to read the current dates.',
    keywords: [
      'calendar',
      'deadline',
      'advising',
      'registration date',
      'drop date',
      'installment date',
      'midterm',
      'final exam date',
      'grade submission',
      'fine',
    ],
    content: `Academic Calendar
UIU publishes an academic calendar for every trimester/semester for each program (Undergraduate, Graduate, B. Pharm). The calendar fixes the following dates for the term:
- Course Advising and Registration window
- Last day of Course Advising and Registration without fine, and the last day with a fine of Tk. 500/-
- Classes Begin
- Last day to drop course(s) with 100% adjustable refund
- Last day to drop course(s) with 50% adjustable refund only
- Last Day of Course Withdrawal (the last day to drop a course with a "W" record in the transcript)
- Last date of 1st, 2nd and 3rd Installment (4th for semester-based B. Pharm)
- Mid-Term Exam window
- Final Exam window
- Last day of Grade Submission (including Self-Study courses)
- Last day of Grade Submission of Incomplete Grades
- Last day to apply for Grade Change of a course from the previous trimester
- Public holidays and class-suspension days

The exact dates change every trimester. This app keeps the official calendar data current in its Calendar tab; the Department of CSE publishes its own undergraduate calendar alongside its course offerings notices.`,
  },

  {
    id: 'kb_project_thesis_completion',
    title: 'Project, Thesis & Internship Completion',
    category: 'Curriculum',
    source: 'UIU Academic Information Policies',
    url: 'https://www.uiu.ac.bd/academics/academic-information-policies/',
    verified: '2026-11',
    summary:
      'Completion windows for undergraduate and graduate project, thesis, internship and field work.',
    keywords: [
      'thesis completion',
      'internship',
      'field work',
      'completion trimester',
      '12 credits',
      '18 credits',
      'project duration',
    ],
    content: `Project/Thesis/Internship/Field Work
Graduate students willing to take a Thesis will not be able to register more than 12 credits out of a total of 18 credits in a single trimester.
The completion period of all undergraduate Project/Thesis/Internship works, irrespective of credit hours, shall be 2 (two) trimesters following the trimester in which the last registration of the same has been made.
The completion period of Thesis/Research Paper or Project/Internship/Field Work for graduate programs having 3 credit hours is the same as above. The completion period of all such works having more than 3 credit hours will, however, be 3 (three) trimesters following the trimester in which the last registration is made.
A particular trimester will be written on Transcripts and Pass Certificates as the "Completion Trimester" in which a student has actually completed his/her degree requirement, instead of the trimester in which the last registration was made.`,
  },

  {
    id: 'kb_internship_requirement',
    title: 'Industry Internship Requirement (CSE 3542)',
    category: 'Curriculum',
    source: 'UIU CSE Department, BSCSE Curriculum (Summer 2026 onwards)',
    url: 'https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2026/04/BSCSE_Curriculum__UIU_2026.pdf',
    verified: '2026-11',
    summary:
      'CSE 3542 is an elective, and completing it requires every other academic credit to be finished first.',
    keywords: ['internship', 'industry internship', 'cse 3542', 'industrial attachment', 'internship eligibility'],
    content: `CSE 3542: Industry Internship
CSE 3542 Industry Internship is listed as an elective course (3.0 credits) in every major track of the BSCSE curriculum.
Prerequisite Course: Completion of all credits except CSE 3542.
A student must complete all their academic credits and requirements before they embark on the internship program.`,
  },

  {
    id: 'kb_transport_service',
    title: 'Student Transportation Service',
    category: 'Campus Services',
    source: 'UIU Notice, Transportation Service',
    url: 'https://www.uiu.ac.bd/notice/transportation-service/',
    verified: '2026-11',
    summary: 'Transportation service charge, registration window and ID card rules.',
    keywords: [
      'transport',
      'shuttle',
      'bus',
      'transportation fee',
      'transport id',
      'notun bazar',
      'kuril',
      '4000',
    ],
    content: `Transportation Service
The charge for the Transportation Service for a student of an Undergraduate/Graduate program is Tk. 4,000/- per trimester.
Registration for the Transportation Service opens at the start of the trimester and continues for roughly two weeks. The Transport ID card is collected from the UIU Operations & Logistics Office by submitting 1 (one) copy of stamp-size photograph and returning the previous Transport ID Card, if any.
Payment of the Transportation Fee must be made in full (no installment) at the time of payment of the 1st Installment of the Tuition Fee for the trimester.
A last date of cancellation of registration is published with the notice for that trimester.`,
  },

  {
    id: 'kb_course_equivalence',
    title: 'Course Equivalence Table',
    category: 'Curriculum',
    source: 'UIU CSE Department, BSCSE Curriculum (Summer 2026 onwards)',
    url: 'https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2026/04/BSCSE_Curriculum__UIU_2026.pdf',
    verified: '2026-11',
    summary: 'Which CSE courses are equivalent to which EEE, MKT and TEC courses for credit transfer.',
    keywords: [
      'course equivalence',
      'equivalent course',
      'transfer',
      'credit transfer',
      'waiver of course',
    ],
    content: `Course Equivalence
Main Course | Equivalent Course
CSE 4853 Internet of Things | EEE 4523 Internet of Things - I
CSE 4379 Real-time Embedded Systems | EEE 4513 Real Time Embedded System Design
CSE 4337 Robotics | EEE 4515 Industrial Automation and Robotics
CSE 4327 VLSI Design | EEE 4121 VLSI Design
CSE 4399 Special Topics on Embedded System and Robotics | EEE 4519 Special Topics on Embedded System and Robotics
CSE 4821 Digital Marketing | MKT 4313 Digital Marketing
CSE 4765 Electronic Commerce | CSE 4763 Electronic Business
GED 4003 Technology Entrepreneurship | TEC 2499 Technology Entrepreneurship`,
  },

  {
    id: 'kb_unsourced_topics',
    title: 'Topics UIU Does Not Publish Online',
    category: 'Official Gaps',
    source: 'Checked against the UIU website on 2026-11',
    url: 'https://www.uiu.ac.bd/academics/',
    verified: '2026-11',
    summary:
      'Rules UIU does not publish on its website, so the advisor must not state a number for them.',
    keywords: [
      'honors',
      'laude',
      'summa',
      'magna',
      'convocation',
      'gold medal',
      'not published',
      'no published rule',
    ],
    content: `Rules UIU does not publish on its website
The following topics are handled by UIU but no rule is published on the public website, so no number should be quoted for them:
- Convocation Latin honours thresholds (Summa Cum Laude, Magna Cum Laude, Cum Laude). UIU's Convocation page and the academic policies pages carry no CGPA cut-off for these awards.
- The exact late-fee amount. The Payment Policies page states that a late fee applies and that the amount is obtainable from the Registrar's Office.
- The exact dates of the current trimester. The Academic Calendar page publishes them per trimester.

For these topics the correct answer names the office that decides it: the Controller of Examinations for convocation honours and the Registrar's Office for fees and calendar dates.`,
  },
];

/**
 * Quick lookup by document id.
 */
export const UIU_KNOWLEDGE_DOCUMENT_MAP = Object.fromEntries(
  UIU_KNOWLEDGE_DOCUMENTS.map((doc) => [doc.id, doc])
);

/**
 * Distinct categories, used by the knowledge base browser filter.
 */
export const UIU_KNOWLEDGE_CATEGORIES = [
  ...new Set(UIU_KNOWLEDGE_DOCUMENTS.map((doc) => doc.category)),
];
