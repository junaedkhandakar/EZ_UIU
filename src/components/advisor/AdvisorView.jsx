import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  MessageSquare,
  Send,
  ShieldCheck,
  Check,
  ChevronRight,
  ChevronDown,
  X,
  Plus,
  ListCheck,
  GitBranch,
  Bot,
  Globe,
  Search,
  FileText,
  Copy,
  Trash2,
  Upload,
} from 'lucide-react';
import Tabs from '../ui/Tabs';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Chip from '../ui/Chip';
import Input, { Field } from '../ui/Input';
import Empty from '../ui/Empty';
import { type } from '../ui/tokens';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import ChatText from './ChatText';
import { getSavedRoutine } from '../../utils/routineStore';
import {
  generateRecommendedBasket,
  generateFullDegreeRoadmap,
  auditCustomSchedule,
  getPrerequisiteTree,
  calculateDegreeTimeline,
  generateFollowUpSuggestions,
  queryUniversalAIAdvisor,
  getPassedCoursesSet,
  normalizeCode,
} from '../../utils/advisorEngine';
import { UIU_KNOWLEDGE_DOCUMENTS } from '../../data/uiuKnowledgeBase';
import {
  ALL_COURSES,
  MAJOR_TRACKS,
  CURRENT_MAJOR_MIN_ELECTIVES,
} from '../../data/advisorData';
import { calculateAcademicMetrics, getEffectiveCourses } from '../../utils/cgpaUtils';
import { useToast } from '../../context/ToastContext';

export default function AdvisorView({
  courses = [],
  settings = {},
}) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('basket');
  const [targetCredits, setTargetCredits] = useState(12);
  const [selectedMajor, setSelectedMajor] = useState('Software Engineering');

  // Custom Schedule Auditor State
  const [auditSelectedCodes, setAuditSelectedCodes] = useState([]);
  const [auditCourseToAdd, setAuditCourseToAdd] = useState('');

  // Prerequisite Visualizer State (defaults to student's registered course or foundational core)
  const [selectedTreeCourse, setSelectedTreeCourse] = useState(() => {
    const routine = getSavedRoutine();
    return routine[0]?.code || 'CSE 1111';
  });

  const [expandedSources, setExpandedSources] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isKbOpen, setIsKbOpen] = useState(false);
  const [kbQuery, setKbQuery] = useState('');
  const [kbCategory, setKbCategory] = useState('ALL');
  const [expandedKbDoc, setExpandedKbDoc] = useState(null);

  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'ai',
      text: 'Ask anything about UIU regulations — FYDP eligibility, retakes, merit waivers, probation, tuition, exam slots or major tracks. Every answer cites the official policy.',
      followUps: [
        'When can I start FYDP / Thesis?',
        'How do retakes affect my CGPA?',
        'What are the merit waiver requirements?',
      ],
      retrievedSources: [],
    },
  ]);

  const toggleSourceExpansion = (idx) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filteredKbDocs = useMemo(() => {
    const q = kbQuery.toLowerCase().trim();
    return UIU_KNOWLEDGE_DOCUMENTS.filter((doc) => {
      const matchCat = kbCategory === 'ALL' || doc.category === kbCategory;
      const matchText =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q) ||
        doc.keywords.some((k) => k.toLowerCase().includes(q));
      return matchCat && matchText;
    });
  }, [kbQuery, kbCategory]);

  const kbCategories = useMemo(() => {
    const cats = new Set(UIU_KNOWLEDGE_DOCUMENTS.map((d) => d.category));
    return ['ALL', ...Array.from(cats)];
  }, []);

  const handleCopyAdvice = (text, idx) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      showToast('Advice copied to clipboard!', 'success');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      showToast('Failed to copy text', 'error');
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        role: 'ai',
        text: "Conversation reset. Ask me anything about UIU courses, FYDP, retakes, or scholarships!",
        followUps: [
          'When can I start FYDP / Thesis?',
          'How do retakes affect my CGPA?',
          'What are the merit waiver requirements?',
        ],
        retrievedSources: [],
      },
    ]);
    showToast('Conversation reset', 'info');
  };

  const metrics = useMemo(() => {
    return calculateAcademicMetrics(getEffectiveCourses(courses));
  }, [courses]);

  const completedCredits = metrics.earnedCredits || 0;
  const currentCgpa = metrics.cgpa || 0;
  const passedCodes = useMemo(() => getPassedCoursesSet(courses), [courses]);

  // Mode 1: Next-Term Recommended Basket
  const basketAnalysis = useMemo(() => {
    return generateRecommendedBasket({
      completedCourses: courses,
      currentCgpa,
      targetCredits,
      selectedMajor,
    });
  }, [courses, currentCgpa, targetCredits, selectedMajor]);

  // Mode 2: Multi-Trimester Degree Roadmap
  const fullDegreeRoadmap = useMemo(() => {
    return generateFullDegreeRoadmap({
      completedCourses: courses,
      currentCgpa,
      maxCreditsPerSem: targetCredits,
      selectedMajor,
      totalDegreeCredits: settings.programCredits || 141,
    });
  }, [courses, currentCgpa, targetCredits, selectedMajor, settings.programCredits]);

  // Mode 3: Custom Schedule Audit
  const customAudit = useMemo(() => {
    return auditCustomSchedule({
      selectedCodes: auditSelectedCodes,
      completedCourses: courses,
      currentCgpa,
    });
  }, [auditSelectedCodes, courses, currentCgpa]);

  // Mode 4: Prerequisite Tree
  const prereqTree = useMemo(() => {
    return getPrerequisiteTree(selectedTreeCourse, courses);
  }, [selectedTreeCourse, courses]);

  // Graduation Timeline
  const timeline = useMemo(() => {
    return calculateDegreeTimeline({
      completedCourses: courses,
      completedCredits,
      totalDegreeCredits: settings.programCredits || 141,
      currentTrimester: Math.min(12, Math.max(1, Math.ceil(completedCredits / 12) + 1)),
      targetTrimester: 12,
      cgpa: currentCgpa,
    });
  }, [courses, completedCredits, currentCgpa, settings.programCredits]);

  // Major Track Progress Audit (Supports 4 electives for Summer 2026+ and 3 for legacy)
  const majorStats = useMemo(() => {
    return Object.entries(MAJOR_TRACKS).map(([name, track]) => {
      const completedInTrack = track.courses.filter((c) =>
        passedCodes.has(normalizeCode(c.course_code))
      );
      const req = track.minElectives || CURRENT_MAJOR_MIN_ELECTIVES;
      return {
        name,
        track,
        completedCount: completedInTrack.length,
        requiredCount: req,
        isCompleted: completedInTrack.length >= req,
      };
    });
  }, [passedCodes]);

  const handleSendQuery = async (textToSend) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const newMsgs = [...chatMessages, { role: 'user', text: query }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsThinking(true);

    try {
      const response = await queryUniversalAIAdvisor({
        prompt: query,
        studentContext: {
          cgpa: currentCgpa,
          completedCredits,
          completedCourseCodes: Array.from(passedCodes),
          selectedMajor,
          currentTrimester: timeline.currentTrimester,
        },
        conversationHistory: chatMessages.slice(-6),
      });
      const replyText = typeof response === 'object' ? response.text : response;
      const sources = typeof response === 'object' ? response.retrievedSources : [];
      const usage = typeof response === 'object' ? response.usage : null;
      const latencyMs = typeof response === 'object' ? response.latencyMs : null;
      const isClientCached = typeof response === 'object' ? response.isClientCached : false;
      const hostedUnavailable =
        typeof response === 'object' ? Boolean(response.hostedUnavailable) : false;
      const hostedErrorMessage =
        typeof response === 'object' ? response.hostedErrorMessage || '' : '';

      const followUps = generateFollowUpSuggestions(query, replyText);

      if (hostedUnavailable) {
        // The advisor only answers with the model. There is no offline
        // engine, so say plainly that the answer could not be produced.
        showToast(
          'The AI advisor is unavailable right now. Please try again in a moment.',
          'error'
        );
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: '',
            error: true,
            errorMessage:
              hostedErrorMessage ||
              'The AI advisor is unavailable right now. Please try again in a moment.',
            retrievedSources: [],
            followUps: [],
          },
        ]);
        return;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: replyText,
          retrievedSources: sources || [],
          usage,
          latencyMs,
          isClientCached,
          followUps,
        },
      ]);
    } catch (err) {
      showToast(err.message || 'Could not reach the AI service', 'error');
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: '',
          error: true,
          errorMessage:
            err.message ||
            'Could not reach the AI advisor. Please check your connection and try again.',
          retrievedSources: [],
          followUps: [],
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const subTabs = [
    { value: 'basket', label: 'Basket', icon: Calendar },
    { value: 'audit', label: 'Auditor', icon: ListCheck },
    { value: 'tree', label: 'Prereqs', icon: GitBranch },
    { value: 'roadmap', label: 'Degree Plan', icon: GraduationCap },
    { value: 'majors', label: 'Tracks', icon: Layers },
    { value: 'copilot', label: 'Ask Advisor', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={type.pageTitle}>AI Academic Advisor</h1>
          <p className={`${type.small} mt-0.5`}>
            Course recommendations, prerequisite chains, and verified UIU policies
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Knowledge Base Browser Button */}
          <Button variant="quiet" size="sm" icon={BookOpen} onClick={() => setIsKbOpen(true)}>
            <span className="hidden sm:inline">UIU Statutes</span>
            <span className="num rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink-3">
              {UIU_KNOWLEDGE_DOCUMENTS.length}
            </span>
          </Button>

          <StatCard
            label="CGPA"
            bodyClassName="num font-mono text-sm font-bold text-accent"
            className="px-3 py-1.5"
          >
            {currentCgpa.toFixed(2)}
          </StatCard>
          <StatCard
            label="Passed"
            bodyClassName="num font-mono text-sm font-bold text-ink"
            className="px-3 py-1.5"
          >
            {completedCredits} cr
          </StatCard>
        </div>
      </div>

      {courses.length === 0 && (
        <Surface tone="accent" className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accentSoft text-accent">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className={type.cardTitle}>No transcript connected</h3>
              <p className={`${type.small} mt-0.5`}>
                Recommendations currently show freshman entry (0 completed credits). Import your UCam
                report in the CGPA tab to personalise your course basket, prerequisite status, and
                graduation timeline.
              </p>
            </div>
          </div>
        </Surface>
      )}

      <Tabs tabs={subTabs} value={activeTab} onChange={setActiveTab} layoutId="advisor-subtabs" />

      {/* ================= MODE 1: NEXT-TERM BASKET ================= */}
      {activeTab === 'basket' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 pop-in">
          {/* Controls & Diagnostics */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Surface>
              <h3 className={type.sectionTitle}>Advising Controls</h3>

              <div className="mt-4 space-y-4">
                <div>
                  <div className={`mb-1.5 flex items-center justify-between ${type.eyebrow}`}>
                    <span>Target trimester load</span>
                    <span className="num font-bold text-accent">{targetCredits} credits</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[10, 11, 12, 13, 14, 15].map((cr) => (
                      <button
                        key={cr}
                        type="button"
                        onClick={() => setTargetCredits(cr)}
                        aria-pressed={targetCredits === cr}
                        className={`rounded-xl border py-2 text-xs font-bold transition-colors duration-150 ${
                          targetCredits === cr
                            ? 'border-accent bg-accentSoft text-accent'
                            : 'border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink'
                        }`}
                      >
                        {cr} cr
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="Target major concentration">
                  <Select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)}>
                    <option value="">No Specialization (General CSE)</option>
                    {Object.keys(MAJOR_TRACKS).map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {/* Basket Diagnostics */}
              <div className="mt-5 border-t border-line pt-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-2">Workload assessment</span>
                    <span
                      className={`font-bold ${
                        courses.length === 0 ? 'text-ink-3' : basketAnalysis.workloadColor
                      }`}
                    >
                      {courses.length === 0 ? '—' : basketAnalysis.workloadGrade}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-2">Eligible unlocked courses</span>
                    <span className="num font-bold text-ink">
                      {courses.length === 0 ? '0 courses' : `${basketAnalysis.eligibleCount} courses`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-2">Final exam slot conflicts</span>
                    <span className="num font-bold text-ok">
                      {courses.length === 0
                        ? '—'
                        : basketAnalysis.examConflicts.length === 0
                          ? '0 clashes (safe)'
                          : `${basketAnalysis.examConflicts.length} clashes`}
                    </span>
                  </div>
                  {courses.length > 0 && basketAnalysis.tightExams?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-warn">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{basketAnalysis.tightExams[0].desc}</span>
                    </div>
                  )}
                </div>
              </div>
            </Surface>
          </div>

          {/* Recommended Course Cards */}
          <div className="flex flex-col gap-3 lg:col-span-7">
            <div className="flex items-center justify-between px-1">
              <h3 className={type.sectionTitle}>
                Recommended course basket
                <span className="num ml-2 rounded-md bg-accentSoft px-2 py-0.5 text-xs font-bold text-accent">
                  {basketAnalysis.totalCredits} credits
                </span>
              </h3>
              <span className={`${type.small} hidden sm:block`}>
                Ranked by prerequisite bottleneck impact
              </span>
            </div>

            {courses.length === 0 ? (
              <Empty
                icon={GraduationCap}
                title="No academic transcript connected"
                sub="Import your UCam grade report in the CGPA tab to calculate your personalized next-term course recommendations and prerequisite paths."
              />
            ) : basketAnalysis.basket.length === 0 ? (
              <Empty
                title="No remaining eligible courses"
                sub="You have completed or are currently taking every required prerequisite."
                compact
              />
            ) : (
              <div className="space-y-3">
                {basketAnalysis.basket.map((c, idx) => (
                  <Surface hover key={c.course_code} pad="sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-accent">
                            {c.course_code}
                          </span>
                          <Badge tone="neutral">{c.credit} cr</Badge>
                          <Badge
                            tone={
                              c.difficulty === 'Hard'
                                ? 'bad'
                                : c.difficulty === 'Medium'
                                  ? 'warn'
                                  : 'ok'
                            }
                          >
                            {c.difficulty || 'Medium'}
                          </Badge>
                        </div>
                        <div className="mt-1 text-[13.5px] font-bold text-ink">{c.course_name}</div>

                        {/* Reason badges */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {c.reasons?.map((r, rIdx) => (
                            <Badge key={rIdx} tone="quiet">
                              {r}
                            </Badge>
                          ))}
                          {c.exam_day && (
                            <span className="text-[10.5px] font-medium text-ink-3">
                              Exam: {c.exam_day} ({c.exam_slot || 'T1'})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={type.eyebrow}>Priority #{idx + 1}</span>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODE 2: CUSTOM SCHEDULE AUDITOR ================= */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 pop-in">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Surface>
              <h3 className={type.sectionTitle}>Schedule stress-tester</h3>
              <p className={`${type.small} mt-1`}>
                Select courses you plan to take together. The auditor verifies prerequisites, final
                exam clashes, and cumulative difficulty.
              </p>

              {/* Add Course Dropdown */}
              <div className="mt-4 flex gap-2">
                <Select
                  value={auditCourseToAdd}
                  onChange={(e) => setAuditCourseToAdd(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Select course to test…</option>
                  {ALL_COURSES.filter(
                    (c) => !auditSelectedCodes.includes(c.course_code)
                  ).map((c) => (
                    <option key={c.course_code} value={c.course_code}>
                      {c.course_code} · {c.course_name}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="primary"
                  size="md"
                  icon={Plus}
                  disabled={!auditCourseToAdd}
                  onClick={() => {
                    setAuditSelectedCodes([...auditSelectedCodes, auditCourseToAdd]);
                    setAuditCourseToAdd('');
                  }}
                >
                  Add
                </Button>
              </div>

              {/* Selected Courses Chips */}
              <div className="mt-4 space-y-2">
                <div className={type.eyebrow}>
                  Courses selected for audit ({auditSelectedCodes.length})
                </div>
                {auditSelectedCodes.length === 0 ? (
                  <p className={`${type.small} py-1`}>
                    No courses added yet. Pick a course above to audit exam slots and prerequisites.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {auditSelectedCodes.map((code) => (
                      <Chip
                        key={code}
                        active
                        size="sm"
                        onRemove={() =>
                          setAuditSelectedCodes(auditSelectedCodes.filter((c) => c !== code))
                        }
                      >
                        {code}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-5 border-t border-line pt-4">
                <span className={type.eyebrow}>Quick actions</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {basketAnalysis.basket.length > 0 && (
                    <Chip
                      active
                      size="sm"
                      onClick={() =>
                        setAuditSelectedCodes(basketAnalysis.basket.map((c) => c.course_code))
                      }
                    >
                      Audit recommended basket ({basketAnalysis.basket.length})
                    </Chip>
                  )}
                  {getSavedRoutine().length > 0 && (
                    <Chip
                      size="sm"
                      onClick={() =>
                        setAuditSelectedCodes(getSavedRoutine().map((c) => c.code))
                      }
                    >
                      Audit saved routine ({getSavedRoutine().length})
                    </Chip>
                  )}
                  {auditSelectedCodes.length > 0 && (
                    <Chip size="sm" onClick={() => setAuditSelectedCodes([])}>
                      Clear selection
                    </Chip>
                  )}
                </div>
              </div>
            </Surface>
          </div>

          {/* Audit Results Panel */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Surface pad="lg">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className={`${type.sectionTitle} flex items-center gap-2`}>
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Audit verdict
                </h3>
                <Badge tone={customAudit.isValid ? 'ok' : 'bad'}>
                  {customAudit.isValid ? 'Approved (safe to register)' : 'Issues detected'}
                </Badge>
              </div>

              {/* Summary Stats */}
              <div className="my-4 grid grid-cols-3 gap-3">
                <StatCard
                  label="Total credits"
                  bodyClassName="num text-lg font-extrabold text-ink"
                  className="text-center"
                >
                  {customAudit.totalCredits} cr
                </StatCard>
                <StatCard
                  label="Hard courses"
                  bodyClassName="num text-lg font-extrabold text-warn"
                  className="text-center"
                >
                  {customAudit.hardCount}
                </StatCard>
                <StatCard
                  label="Exam clashes"
                  bodyClassName="num text-lg font-extrabold text-ok"
                  className="text-center"
                >
                  {customAudit.examConflicts.length}
                </StatCard>
              </div>

              {/* Blocked or Warning Messages */}
              {customAudit.blockedCourses.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h4 className="text-xs font-bold text-bad flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Prerequisite issues
                  </h4>
                  {customAudit.blockedCourses.map((b) => (
                    <div
                      key={b.code}
                      className="rounded-xl border border-bad/25 bg-bad/10 p-3 text-xs text-bad"
                    >
                      <b>{b.code}:</b> {b.reason}
                    </div>
                  ))}
                </div>
              )}

              {/* Exam Clashes */}
              {customAudit.examConflicts.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h4 className="text-xs font-bold text-bad flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Final exam collision
                  </h4>
                  {customAudit.examConflicts.map((c, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-bad/25 bg-bad/10 p-3 text-xs text-bad"
                    >
                      {c.desc}
                    </div>
                  ))}
                </div>
              )}

              {/* Approved Courses List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-ink-2">Valid courses</h4>
                {customAudit.validCourses.map((c) => (
                  <div
                    key={c.course_code}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface2/50 p-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-accent mr-2">
                        {c.course_code}
                      </span>
                      <span className="text-ink font-semibold">{c.course_name}</span>
                    </div>
                    <span className="text-ink-3">
                      {c.credit} cr · {c.difficulty} · Exam: {c.exam_day} ({c.exam_slot})
                    </span>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </div>
      )}

      {/* ================= MODE 3: PREREQUISITE TREE ================= */}
      {activeTab === 'tree' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 pop-in">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Surface>
              <h3 className={`${type.sectionTitle} flex items-center gap-2`}>
                <GitBranch className="h-4 w-4 text-accent" />
                Course prerequisite explorer
              </h3>
              <p className={`${type.small} mt-1`}>
                Select any course to trace its complete upstream prerequisite chain and see what is
                already passed vs. still missing.
              </p>

              <div className="mt-4">
                <Field label="Target course">
                  <Select
                    value={selectedTreeCourse}
                    onChange={(e) => setSelectedTreeCourse(e.target.value)}
                  >
                    {ALL_COURSES.map((c) => (
                      <option key={c.course_code} value={c.course_code}>
                        {c.course_code} · {c.course_name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {/* Quick Jump Buttons */}
              <div className="mt-4">
                <span className={type.eyebrow}>High-impact capstones to explore</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['CSE 4889', 'CSE 4611', 'CSE 4783', 'CSE 4587', 'CSE 3811', 'CSE 3411'].map(
                    (code) => (
                      <Chip
                        key={code}
                        active={selectedTreeCourse === code}
                        size="sm"
                        onClick={() => setSelectedTreeCourse(code)}
                        className="font-mono"
                      >
                        {code}
                      </Chip>
                    )
                  )}
                </div>
              </div>
            </Surface>
          </div>

          {/* Tree Visualization Card */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Surface>
              {prereqTree && (
                <div>
                  <div className="flex items-start justify-between border-b border-line pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-extrabold text-accent">
                          {prereqTree.target.course_code}
                        </span>
                        <Badge tone="neutral">{prereqTree.target.credit} cr</Badge>
                      </div>
                      <h3 className="text-base font-bold text-ink mt-0.5">
                        {prereqTree.target.course_name}
                      </h3>
                    </div>

                    <Badge
                      tone={
                        prereqTree.isTargetPassed
                          ? 'ok'
                          : prereqTree.arePrereqsMet
                            ? 'accent'
                            : 'bad'
                      }
                    >
                      {prereqTree.isTargetPassed
                        ? 'Passed already'
                        : prereqTree.arePrereqsMet
                          ? 'Unlocked and ready to take'
                          : 'Locked by prerequisites'}
                    </Badge>
                  </div>

                  {/* Chain List */}
                  <div className="mt-5 space-y-3">
                    <h4 className={type.eyebrow}>
                      Required upstream chain ({prereqTree.prerequisitesList.length} prerequisite courses)
                    </h4>

                    {prereqTree.prerequisitesList.length === 0 ? (
                      <div className="rounded-xl border border-line bg-surface2/40 p-4 text-xs text-ink-3 text-center">
                        This is an entry-level course with no prerequisites, so you can take it any term.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {prereqTree.prerequisitesList.map((node, idx) => (
                          <div
                            key={node.code}
                            className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-colors ${
                              node.isPassed
                                ? 'border-ok/30 bg-ok/5 text-ink'
                                : 'border-bad/30 bg-bad/5 text-ink'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                                  node.isPassed ? 'bg-ok text-white' : 'bg-bad text-white'
                                }`}
                              >
                                {node.isPassed ? (
                                  <Check className="h-3 w-3 stroke-[2.5]" />
                                ) : (
                                  <X className="h-3 w-3 stroke-[2.5]" />
                                )}
                              </span>
                              <div>
                                <span className="font-mono font-bold text-accent mr-2">
                                  {node.code}
                                </span>
                                <span className="font-medium text-ink">{node.name}</span>
                              </div>
                            </div>

                            <span
                              className={`num font-bold text-[11px] ${
                                node.isPassed ? 'text-ok' : 'text-bad'
                              }`}
                            >
                              {node.isPassed ? 'Passed' : 'Still Required'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Surface>
          </div>
        </div>
      )}

      {/* ================= MODE 4: FULL DEGREE ROADMAP ================= */}
      {activeTab === 'roadmap' && (
        <div className="flex flex-col gap-4 pop-in">
          {/* Degree Velocity KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Completed credits"
              sub={`${((timeline.safeCompleted / timeline.totalDegreeCredits) * 100).toFixed(1)}% completed`}
              bodyClassName="num text-2xl font-extrabold text-ink sm:text-3xl"
            >
              {timeline.safeCompleted}
              <span className="text-xs font-normal text-ink-3"> / {timeline.totalDegreeCredits} cr</span>
            </StatCard>

            <StatCard
              label="Remaining credits"
              sub="Across remaining trimesters"
              tone="accent"
              bodyClassName="num text-2xl font-extrabold text-accent sm:text-3xl"
            >
              {timeline.remainingCredits}
              <span className="text-xs font-normal text-ink-3"> cr</span>
            </StatCard>

            <StatCard
              label="Pacing requirement"
              sub={timeline.paceLabel}
              bodyClassName="num text-2xl font-extrabold text-ink sm:text-3xl"
            >
              {timeline.creditsPerTermNeeded}
              <span className="text-xs font-normal text-ink-3"> cr/term</span>
            </StatCard>

            <StatCard
              label="FYDP / thesis status"
              sub={
                timeline.fydpEligible
                  ? 'Ready for CSE 4000A'
                  : `Credits left to reach ${timeline.fydpRequiredCredits} cr`
              }
              bodyClassName="num text-2xl font-extrabold text-ink sm:text-3xl"
            >
              {timeline.fydpEligible ? (
                <span className="text-xl text-ok">Eligible</span>
              ) : (
                <span>{timeline.creditsToFydp} cr</span>
              )}
            </StatCard>
          </div>

          {/* FYDP Milestone Card */}
          <Surface>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-accent" />
                  <h3 className="text-base font-bold text-ink">
                    Final Year Design Project (FYDP I / CSE 4000A) Gatekeeper
                  </h3>
                </div>
                <p className="mt-1 max-w-2xl text-xs text-ink-2">
                  The UIU CSE FYDP Handbook requires at least{' '}
                  {timeline.fydpRequiredCredits} completed credits before enrollment in FYDP I.
                  {timeline.fydpEligible
                    ? ` You have passed the ${timeline.fydpRequiredCredits}-credit mark and can register for CSE 4000A.`
                    : ` You currently need ${timeline.creditsToFydp} more credits to qualify.`}
                </p>
                <a
                  href="https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2025/09/FYDP_Handbookv1_FINAL.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-accent hover:underline"
                >
                  <Globe className="h-3 w-3 shrink-0" />
                  FYDP Handbook v1.0 (16 September 2025)
                </a>
              </div>

              <div className="w-full shrink-0 sm:w-64">
                <div className={`mb-1.5 flex justify-between text-xs font-semibold ${type.eyebrow}`}>
                  <span>Progress to {timeline.fydpRequiredCredits} cr</span>
                  <span className="num text-accent">
                    {Math.min(timeline.fydpRequiredCredits, timeline.safeCompleted)} /{' '}
                    {timeline.fydpRequiredCredits} cr
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface2">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent2 transition-[width] duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        (timeline.safeCompleted / timeline.fydpRequiredCredits) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Surface>

          {/* Multi-Term Semester Roadmap Grid */}
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={type.sectionTitle}>Multi-trimester degree plan</h3>
              <span className={type.small}>
                Calculated up to Trimester 12 under {targetCredits} cr/term
              </span>
            </div>

            {courses.length === 0 ? (
              <Empty
                icon={GraduationCap}
                title="No academic transcript connected"
                sub="Connect your completed transcript in the CGPA tab to calculate your personalized degree roadmap and milestone timeline."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {fullDegreeRoadmap.map((sem) => (
                  <Surface hover key={sem.trimesterNum} pad="sm">
                    <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                      <span className="text-sm font-bold text-accent">{sem.title}</span>
                      <Badge tone="neutral">{sem.credits} cr</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {sem.courses.map((c) => (
                        <div
                          key={c.course_code}
                          className="flex items-center justify-between rounded-lg p-1.5 text-xs hover:bg-surface2/60"
                        >
                          <div className="min-w-0 truncate mr-2">
                            <span className="mr-1.5 font-mono font-bold text-accent">
                              {c.course_code}
                            </span>
                            <span className="truncate text-ink">{c.course_name}</span>
                          </div>
                          <span className="shrink-0 font-mono text-ink-3">{c.credit} cr</span>
                        </div>
                      ))}
                    </div>
                  </Surface>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODE 5: MAJOR CONCENTRATIONS ================= */}
      {activeTab === 'majors' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pop-in">
          {courses.length === 0 && (
            <Surface className="col-span-1 md:col-span-2 p-4 text-center border-accent/30 bg-accentSoft/20">
              <p className="text-xs text-ink-2 font-semibold">
                No transcript connected yet. Import your UCAM report in the CGPA tab to track which track electives you have already completed.
              </p>
            </Surface>
          )}
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
                    {completedCount} / {requiredCount} electives
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className={type.eyebrow}>Elective courses in this track</div>
                  {track.courses.map((c) => {
                    const isPassed = passedCodes.has(normalizeCode(c.course_code));
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
                <span className="text-ink-3">
                  Rule: {requiredCount} courses required for specialization
                </span>
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
        </div>
      )}

      {/* ================= MODE 6: ASK ADVISOR COPILOT ================= */}
      {activeTab === 'copilot' && (
        <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full pop-in">
          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              'When can I start FYDP / Thesis?',
              'How do retakes affect my CGPA?',
              'What are the merit waiver requirements?',
              'What should I take for Data Science track?',
              'How to recover from probation?',
              'What are the installment deadlines?',
            ].map((chip) => (
              <Chip key={chip} size="sm" onClick={() => handleSendQuery(chip)}>
                {chip}
              </Chip>
            ))}
          </div>

          {/* Chat utilities header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-ink-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsKbOpen(true)}
                className="text-[11px] text-accent hover:underline flex items-center gap-1 font-semibold"
              >
                <BookOpen className="h-3 w-3" /> {UIU_KNOWLEDGE_DOCUMENTS.length} UIU Statutes
              </button>
              <button
                onClick={handleClearChat}
                className="text-[11px] text-ink-3 hover:text-bad flex items-center gap-1 transition-colors"
                title="Clear conversation history"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <Surface className="min-h-[340px] max-h-[500px] space-y-4 overflow-y-auto overscroll-contain">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-surface2 text-ink-2">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-[13.5px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent font-medium text-white'
                      : 'border border-line bg-surface2/60 text-ink shadow-sm'
                  }`}
                >
                  {/* Top Bar for AI Response */}
                  {msg.role === 'ai' && (
                    <div className="flex items-center justify-between gap-2 border-b border-line/40 pb-1.5 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {msg.latencyMs != null && !msg.isClientCached && (
                          <span className="text-[9.5px] text-ink-3 font-mono opacity-80">
                            {(msg.latencyMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopyAdvice(msg.text, i)}
                        className="rounded p-1 text-ink-3 hover:text-accent transition-colors"
                        title="Copy advice to clipboard"
                      >
                        {copiedIndex === i ? (
                          <Check className="h-3 w-3 text-ok" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Explicit failure notice when the advisor could not answer */}
                  {msg.error && (
                    <div className="mb-2.5 flex items-start gap-2 rounded-lg border border-bad/30 bg-bad/10 px-2.5 py-2 text-[11px] leading-relaxed text-ink-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bad" />
                      <div>
                        <div className="font-semibold text-ink">
                          The AI advisor could not answer this question.
                        </div>
                        {msg.errorMessage && (
                          <div className="mt-0.5 text-ink-3">{msg.errorMessage}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {msg.text && <ChatText text={msg.text} />}

                  {/* Contextual Suggested Follow-up Chips */}
                  {msg.followUps && msg.followUps.length > 0 && (
                    <div className="mt-3 border-t border-line/60 pt-2 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-ink-3 font-semibold mr-1">Follow-up:</span>
                      {msg.followUps.map((fu, fuIdx) => (
                        <Chip key={fuIdx} size="sm" onClick={() => handleSendQuery(fu)}>
                          {fu}
                        </Chip>
                      ))}
                    </div>
                  )}

                  {/* Cited policy sources */}
                  {msg.retrievedSources && msg.retrievedSources.length > 0 && (
                    <div className="mt-2.5 border-t border-line/60 pt-2">
                      <button
                        type="button"
                        onClick={() => toggleSourceExpansion(i)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accentSoft px-2.5 py-1 text-[11px] font-semibold text-accent hover:border-accent transition-colors shadow-sm"
                      >
                        <BookOpen className="h-3 w-3 text-accent" />
                        <span>
                          {msg.retrievedSources.length}{' '}
                          {msg.retrievedSources.length === 1 ? 'policy source' : 'policy sources'}
                        </span>
                        <ChevronDown
                          className={`h-3 w-3 transition-transform duration-200 ${
                            expandedSources[i] ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedSources[i] && (
                        <div className="mt-2 space-y-2 fade-in">
                          {msg.retrievedSources.map((src, srcIdx) => (
                            <div
                              key={`${src.id}-${srcIdx}`}
                              className="rounded-xl border border-line bg-surface p-3 text-xs shadow-card"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="font-bold text-ink text-[12px]">{src.title}</div>
                                <Badge
                                  tone="ok"
                                  icon={ShieldCheck}
                                  title={`Checked against the official source on ${src.verified}`}
                                >
                                  Verified {src.verified}
                                </Badge>
                              </div>
                              <div className="text-[10.5px] text-ink-3 mt-0.5">
                                {src.source} · {src.category}
                              </div>
                              <p className="mt-2 rounded-lg bg-surface2/60 p-2.5 text-[11px] leading-relaxed text-ink-2 border border-line/60 whitespace-pre-line">
                                {src.snippet}
                              </p>
                              {src.url && (
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-semibold text-accent hover:underline break-all"
                                >
                                  <Globe className="h-3 w-3 shrink-0" />
                                  {src.url.replace(/^https?:\/\//, '')}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-surface2 text-ink-2">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center rounded-xl border border-line bg-surface2/60 px-4 py-3 text-xs text-ink-3">
                  <span className="animate-pulse">Thinking…</span>
                </div>
              </div>
            )}
          </Surface>

          {/* Chat Input Bar */}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
              placeholder="Ask anything about UIU prerequisites, waivers, electives, or FYDP…"
              className="h-11 flex-1 px-4 text-sm"
              wrapperClassName="flex-1"
            />
            <Button
              variant="primary"
              size="lg"
              icon={Send}
              onClick={() => handleSendQuery()}
              disabled={!chatInput.trim() || isThinking}
            >
              Ask
            </Button>
          </div>
        </div>
      )}

      {/* UIU Official Knowledge Base Explorer Modal */}
      <Modal
        open={isKbOpen}
        onClose={() => setIsKbOpen(false)}
        title="UIU Knowledge Base & Policy Statutes"
        sub={`Official UIU regulations, exam rules, waivers and fee policies — ${UIU_KNOWLEDGE_DOCUMENTS.length} documents`}
        width="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Search Bar & Category Filter */}
          <div className="space-y-3">
            <Input
              type="text"
              value={kbQuery}
              onChange={(e) => setKbQuery(e.target.value)}
              placeholder="Search statutes, exam rules, waivers, FYDP…"
              icon={Search}
              onClear={() => setKbQuery('')}
              wrapperClassName="w-full"
            />

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
              {kbCategories.map((cat) => (
                <Chip
                  key={cat}
                  size="sm"
                  active={kbCategory === cat}
                  onClick={() => setKbCategory(cat)}
                >
                  {cat === 'ALL' ? `All policies (${UIU_KNOWLEDGE_DOCUMENTS.length})` : cat}
                </Chip>
              ))}
            </div>
          </div>

          {/* Documents List */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
            {filteredKbDocs.length === 0 ? (
              <Empty
                icon={FileText}
                title="No matching policy clauses"
                sub="Try different search terms, or switch back to all policies."
                compact
              />
            ) : (
              filteredKbDocs.map((doc) => {
                const isExpanded = expandedKbDoc === doc.id;
                return (
                  <Surface key={doc.id} pad="sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="accent">{doc.category}</Badge>
                          <Badge
                            tone="ok"
                            icon={ShieldCheck}
                            title={`Checked against the official source on ${doc.verified}`}
                          >
                            Verified {doc.verified}
                          </Badge>
                          <span className="text-[10.5px] text-ink-3 font-mono">
                            Authority: {doc.source}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-bold text-ink">{doc.title}</h4>
                        <p className="mt-1 text-xs text-ink-2 leading-relaxed">{doc.summary}</p>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-accent hover:underline break-all"
                          >
                            <Globe className="h-3 w-3 shrink-0" />
                            {doc.url.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>

                      <Button
                        variant={isExpanded ? 'secondary' : 'quiet'}
                        size="sm"
                        className="shrink-0"
                        onClick={() => setExpandedKbDoc(isExpanded ? null : doc.id)}
                      >
                        {isExpanded ? 'Hide clause' : 'View clause'}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3.5 border-t border-line/60 pt-3 fade-in">
                        <div className="rounded-xl border border-line/80 bg-surface2/60 p-3.5 font-mono text-[11.5px] leading-relaxed text-ink whitespace-pre-line">
                          {doc.content}
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          <span className="text-[10.5px] text-ink-3 uppercase tracking-[0.08em] font-semibold mr-1 self-center">
                            Indexed keywords
                          </span>
                          {doc.keywords.map((k) => (
                            <span
                              key={k}
                              className="rounded bg-surface border border-line px-1.5 py-0.5 text-[9.5px] text-ink-3"
                            >
                              #{k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Surface>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
