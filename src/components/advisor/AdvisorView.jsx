import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  MessageSquare,
  Send,
  Zap,
  ShieldCheck,
  Check,
  ChevronRight,
  CalendarCheck,
} from 'lucide-react';
import Tabs from '../ui/Tabs';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import Select from '../ui/Select';
import {
  generateRecommendedBasket,
  calculateDegreeTimeline,
  generateAIAnswer,
  getPassedCoursesSet,
} from '../../utils/advisorEngine';
import { MAJOR_TRACKS } from '../../data/advisorData';
import { calculateAcademicMetrics, getEffectiveCourses, formatTrimester } from '../../utils/cgpaUtils';
import { useToast } from '../../context/ToastContext';

export default function AdvisorView({
  courses = [],
  settings = {},
  onNavigateToRoutine,
}) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('basket');
  const [targetCredits, setTargetCredits] = useState(12);
  const [selectedMajor, setSelectedMajor] = useState('Software Engineering');

  // AI Copilot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'ai',
      text: "👋 Hello! I'm your **UIU AI Academic Advisor**. Based on your transcript and curriculum requirements, I can recommend your next optimal course basket, verify prerequisite readiness, check exam clashes, and audit your graduation timeline. How can I help you today?",
    },
  ]);

  const metrics = useMemo(() => {
    return calculateAcademicMetrics(getEffectiveCourses(courses));
  }, [courses]);

  const completedCredits = metrics.earnedCredits || 0;
  const currentCgpa = metrics.cgpa || 3.0;

  // Next-Term Recommended Basket
  const basketAnalysis = useMemo(() => {
    return generateRecommendedBasket({
      completedCourses: courses,
      currentCgpa,
      targetCredits,
      selectedMajor,
    });
  }, [courses, currentCgpa, targetCredits, selectedMajor]);

  // Graduation Timeline
  const timeline = useMemo(() => {
    return calculateDegreeTimeline({
      completedCredits,
      totalDegreeCredits: settings.programCredits || 138,
      currentTrimester: Math.min(12, Math.max(1, Math.ceil(completedCredits / 12) + 1)),
      targetTrimester: 12,
    });
  }, [completedCredits, settings.programCredits]);

  // Major Track Progress Audit
  const passedCodes = useMemo(() => getPassedCoursesSet(courses), [courses]);
  const majorStats = useMemo(() => {
    return Object.entries(MAJOR_TRACKS).map(([name, track]) => {
      const completedInTrack = track.courses.filter((c) =>
        passedCodes.has(c.course_code.toUpperCase())
      );
      return {
        name,
        track,
        completedCount: completedInTrack.length,
        requiredCount: 3,
        isCompleted: completedInTrack.length >= 3,
      };
    });
  }, [passedCodes]);

  // Handler to push recommended courses directly to Routine Builder
  const handlePushToRoutine = () => {
    try {
      const selectedForRoutine = basketAnalysis.basket.map((c) => ({
        code: c.course_code,
        sectionId: null,
      }));
      localStorage.setItem('ez_routine_selected', JSON.stringify(selectedForRoutine));
      showToast(`Pushed ${selectedForRoutine.length} courses to Routine Builder!`, 'success');
      onNavigateToRoutine?.();
    } catch {
      showToast('Error syncing with Routine Builder', 'error');
    }
  };

  const handleSendQuery = (textToSend) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const newMsgs = [...chatMessages, { role: 'user', text: query }];
    setChatMessages(newMsgs);
    setChatInput('');

    setTimeout(() => {
      const response = generateAIAnswer(query, {
        cgpa: currentCgpa,
        completedCredits,
      });
      setChatMessages((prev) => [...prev, { role: 'ai', text: response }]);
    }, 250);
  };

  const subTabs = [
    { value: 'basket', label: 'Next-Term Basket', icon: Sparkles },
    { value: 'roadmap', label: 'Graduation Timeline', icon: GraduationCap },
    { value: 'majors', label: 'Major Concentrations', icon: Layers },
    { value: 'copilot', label: 'Ask Advisor', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            Intelligent Prerequisite & Curriculum Engine
          </div>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink sm:text-3xl">
            AI Academic Advisor
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 shadow-card">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">CGPA</span>
            <span className="num font-mono text-sm font-bold text-accent">{currentCgpa.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 shadow-card">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Completed</span>
            <span className="num font-mono text-sm font-bold text-ink">{completedCredits} cr</span>
          </div>
        </div>
      </div>

      <Tabs tabs={subTabs} value={activeTab} onChange={setActiveTab} layoutId="advisor-subtabs" />

      {/* ================= TAB 1: NEXT-TERM BASKET ================= */}
      {activeTab === 'basket' && (
        <motion.div
          key="basket"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-12"
        >
          {/* Controls & Summary */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Surface className="p-5">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">Advising Controls</h3>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold uppercase tracking-wider text-ink-3">
                      Target Trimester Load
                    </span>
                    <span className="num font-bold text-accent">{targetCredits} Credits</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[9, 12, 13.5, 15].map((cr) => (
                      <button
                        key={cr}
                        onClick={() => setTargetCredits(cr)}
                        className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                          targetCredits === cr
                            ? 'border-accent bg-accentSoft text-accent'
                            : 'border-line bg-surface2/60 text-ink-3 hover:text-ink'
                        }`}
                      >
                        {cr} cr
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                    Target Major Concentration
                  </label>
                  <Select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)}>
                    <option value="">No Specialization (General CSE)</option>
                    {Object.keys(MAJOR_TRACKS).map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Basket Diagnostics */}
              <div className="mt-5 border-t border-line pt-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-2">Workload Assessment:</span>
                  <span className={`font-bold ${basketAnalysis.workloadColor}`}>
                    {basketAnalysis.workloadGrade}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-2">Eligible Unlocked Courses:</span>
                  <span className="num font-bold text-ink">{basketAnalysis.eligibleCount} courses</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-2">Final Exam Slot Conflicts:</span>
                  <span className="num font-bold text-ok">
                    {basketAnalysis.examConflicts.length === 0 ? '0 Clashes (Safe)' : `${basketAnalysis.examConflicts.length} Clashes`}
                  </span>
                </div>
              </div>

              {/* Push to routine builder action */}
              <div className="mt-5 border-t border-line pt-4">
                <Button
                  variant="primary"
                  className="w-full justify-center shadow-lg"
                  icon={CalendarCheck}
                  onClick={handlePushToRoutine}
                >
                  Push Basket to Routine Builder
                </Button>
                <p className="mt-2 text-center text-[11px] text-ink-3">
                  Transfers these recommended courses directly into the clash-free schedule solver.
                </p>
              </div>
            </Surface>
          </div>

          {/* Recommended Course Cards */}
          <div className="flex flex-col gap-3 lg:col-span-7">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">
                Recommended Course Basket
                <span className="num ml-2 rounded-md bg-accentSoft px-2 py-0.5 text-xs font-bold text-accent">
                  {basketAnalysis.totalCredits} Credits
                </span>
              </h3>
              <span className="text-xs text-ink-3">
                Ranked by prerequisite bottleneck impact
              </span>
            </div>

            {basketAnalysis.basket.length === 0 ? (
              <Surface className="p-8 text-center">
                <p className="text-sm font-semibold text-ink-2">No remaining eligible courses</p>
                <p className="mt-1 text-xs text-ink-3">
                  You have completed or are currently taking all required prerequisites!
                </p>
              </Surface>
            ) : (
              <div className="space-y-3">
                {basketAnalysis.basket.map((c, idx) => (
                  <Surface hover key={c.course_code} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-accent">
                            {c.course_code}
                          </span>
                          <span className="rounded-md border border-line bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink-2">
                            {c.credit} cr
                          </span>
                          <span
                            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                              c.difficulty === 'Hard'
                                ? 'border-bad/30 bg-bad/10 text-bad'
                                : c.difficulty === 'Medium'
                                  ? 'border-warn/30 bg-warn/10 text-warn'
                                  : 'border-ok/30 bg-ok/10 text-ok'
                            }`}
                          >
                            {c.difficulty || 'Medium'}
                          </span>
                        </div>
                        <div className="mt-1 text-[13.5px] font-bold text-ink">{c.course_name}</div>

                        {/* Reason badges */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {c.reasons?.map((r, rIdx) => (
                            <span
                              key={rIdx}
                              className="rounded-lg border border-line bg-surface2/60 px-2 py-0.5 text-[10.5px] font-semibold text-ink-2"
                            >
                              {r}
                            </span>
                          ))}
                          {c.exam_day && (
                            <span className="rounded-lg border border-line bg-surface2/40 px-2 py-0.5 text-[10.5px] font-medium text-ink-3">
                              Exam: {c.exam_day} ({c.exam_slot || 'T1'})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                          Priority #{idx + 1}
                        </span>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ================= TAB 2: GRADUATION ROADMAP ================= */}
      {activeTab === 'roadmap' && (
        <motion.div
          key="roadmap"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-12"
        >
          {/* Degree Velocity KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:col-span-12">
            <Surface hover className="p-4 sm:p-5">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
                Completed Credits
              </span>
              <div className="num mt-2 text-2xl sm:text-3xl font-extrabold text-ink">
                {timeline.safeCompleted}
                <span className="text-xs text-ink-3 font-normal"> / {timeline.totalDegreeCredits} cr</span>
              </div>
              <div className="mt-1 text-xs text-ink-3">
                {((timeline.safeCompleted / timeline.totalDegreeCredits) * 100).toFixed(1)}% Completed
              </div>
            </Surface>

            <Surface hover className="p-4 sm:p-5">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
                Remaining Credits
              </span>
              <div className="num mt-2 text-2xl sm:text-3xl font-extrabold text-accent">
                {timeline.remainingCredits}
                <span className="text-xs text-ink-3 font-normal"> cr</span>
              </div>
              <div className="mt-1 text-xs text-ink-3">Across remaining trimesters</div>
            </Surface>

            <Surface hover className="p-4 sm:p-5">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
                Pacing Requirement
              </span>
              <div className="num mt-2 text-2xl sm:text-3xl font-extrabold text-ink">
                {timeline.creditsPerTermNeeded}
                <span className="text-xs text-ink-3 font-normal"> cr/term</span>
              </div>
              <div className={`mt-1 text-xs font-semibold ${timeline.paceColor}`}>
                {timeline.paceLabel}
              </div>
            </Surface>

            <Surface hover className="p-4 sm:p-5">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
                FYDP / Thesis Status
              </span>
              <div className="num mt-2 text-2xl sm:text-3xl font-extrabold text-ink">
                {timeline.fydpEligible ? (
                  <span className="text-ok text-xl">Eligible</span>
                ) : (
                  <span>{timeline.creditsToFydp} cr</span>
                )}
              </div>
              <div className="mt-1 text-xs text-ink-3">
                {timeline.fydpEligible
                  ? 'Ready for CSE 4000A'
                  : 'Credits left to reach 100 cr'}
              </div>
            </Surface>
          </div>

          {/* FYDP Milestone Card */}
          <Surface className="p-5 lg:col-span-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-accent" />
                  <h3 className="text-base font-bold text-ink">
                    Final Year Design Project (FYDP I / CSE 4000A) Readiness
                  </h3>
                </div>
                <p className="mt-1 text-xs text-ink-2 max-w-2xl">
                  UIU Department of CSE requires **100 credits completed** before enrollment in FYDP I.
                  {timeline.fydpEligible
                    ? ' You have crossed the 100-credit mark! You are authorized to register for CSE 4000A.'
                    : ` You currently need ${timeline.creditsToFydp} more credits to qualify.`}
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-64">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-ink-3">Progress to 100 cr</span>
                  <span className="num text-accent">
                    {Math.min(100, timeline.safeCompleted)} / 100 cr
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-surface2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent to-accent2"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (timeline.safeCompleted / 100) * 100)}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  />
                </div>
              </div>
            </div>
          </Surface>
        </motion.div>
      )}

      {/* ================= TAB 3: MAJOR CONCENTRATIONS ================= */}
      {activeTab === 'majors' && (
        <motion.div
          key="majors"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {majorStats.map(({ name, track, completedCount, requiredCount, isCompleted }) => (
            <Surface hover key={name} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-ink">{name}</h3>
                    <p className="mt-0.5 text-xs text-ink-3">{track.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      isCompleted
                        ? 'bg-ok/15 text-ok border border-ok/30'
                        : 'bg-surface2 text-ink-3 border border-line'
                    }`}
                  >
                    {completedCount} / {requiredCount} Electives
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                    Elective Courses in this Track:
                  </div>
                  {track.courses.map((c) => {
                    const isPassed = passedCodes.has(c.course_code.toUpperCase());
                    return (
                      <div
                        key={c.course_code}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-colors ${
                          isPassed
                            ? 'border-ok/30 bg-ok/5 text-ink'
                            : 'border-line bg-surface2/50 text-ink-2'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-accent">{c.course_code}</span>
                          <span className="font-medium text-ink truncate max-w-[190px]">
                            {c.course_name}
                          </span>
                        </div>
                        {isPassed ? (
                          <span className="flex items-center gap-1 font-bold text-ok text-[11px]">
                            <Check className="h-3 w-3" /> Passed
                          </span>
                        ) : (
                          <span className="text-[10.5px] font-semibold text-ink-3">
                            {c.credit} cr · {c.difficulty}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 border-t border-line pt-3 flex items-center justify-between text-xs">
                <span className="text-ink-3">Rule: Minimum 3 courses required</span>
                <button
                  onClick={() => {
                    setSelectedMajor(name);
                    setActiveTab('basket');
                    showToast(`Active major set to ${name}`, 'info');
                  }}
                  className="font-bold text-accent hover:underline flex items-center gap-1"
                >
                  Prioritize in Basket <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </Surface>
          ))}
        </motion.div>
      )}

      {/* ================= TAB 4: ASK ADVISOR COPILOT ================= */}
      {activeTab === 'copilot' && (
        <motion.div
          key="copilot"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex flex-col gap-4 max-w-3xl mx-auto w-full"
        >
          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              'When can I start FYDP / Thesis?',
              'How do retakes affect my CGPA?',
              'What are the merit waiver requirements?',
              'What should I take for Data Science track?',
              'How to recover from probation?',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendQuery(chip)}
                className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 shadow-sm transition-all hover:border-accent hover:text-accent active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <Surface className="p-4 sm:p-5 min-h-[340px] max-h-[500px] overflow-y-auto space-y-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent to-accent2 p-1.5 text-white shrink-0 shadow-md">
                    <Sparkles className="h-full w-full" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-accent text-white font-medium'
                      : 'border border-line bg-surface2/60 text-ink shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
              </div>
            ))}
          </Surface>

          {/* Chat Input Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
              placeholder="Ask anything about UIU prerequisites, waivers, electives, or FYDP..."
              className="h-11 flex-1 rounded-xl border border-line bg-surface px-4 text-sm text-ink placeholder-ink-3 shadow-card outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
            <Button
              variant="primary"
              size="lg"
              icon={Send}
              onClick={() => handleSendQuery()}
              disabled={!chatInput.trim()}
            >
              Ask
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
