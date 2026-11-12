import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronDown,
  Key,
  Network,
  ListCheck,
  X,
  Plus,
  GitBranch,
  Bot,
  Cpu,
  Globe,
  ExternalLink,
  Settings2,
  RefreshCw,
  Search,
  FileText,
  Copy,
  Flame,
  Trash2,
  Upload,
} from 'lucide-react';
import Tabs from '../ui/Tabs';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import { getSavedRoutine } from '../../utils/routineStore';
import {
  AI_PROVIDERS,
  generateRecommendedBasket,
  generateFullDegreeRoadmap,
  auditCustomSchedule,
  getPrerequisiteTree,
  calculateDegreeTimeline,
  generateAIAnswer,
  generateFollowUpSuggestions,
  queryUniversalAIAdvisor,
  getPassedCoursesSet,
  checkVercelServerlessStatus,
} from '../../utils/advisorEngine';
import { UIU_KNOWLEDGE_DOCUMENTS } from '../../data/uiuKnowledgeBase';
import { ALL_COURSES, MAJOR_TRACKS } from '../../data/advisorData';
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

  // AI Provider & Settings State (OpenRouter with Prompt Caching is Primary)
  const [selectedProvider, setSelectedProvider] = useState(() => {
    try {
      return localStorage.getItem('ez_ai_provider') || 'openrouter';
    } catch {
      return 'openrouter';
    }
  });

  const [providerKeys, setProviderKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('ez_ai_keys');
      if (saved) return JSON.parse(saved);
      const legacyOr = localStorage.getItem('ez_openrouter_api_key');
      return { openrouter: legacyOr || '' };
    } catch {
      return { openrouter: '' };
    }
  });

  const [providerModels, setProviderModels] = useState(() => {
    try {
      const saved = localStorage.getItem('ez_ai_models');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      openrouter: 'deepseek/deepseek-r1:free',
    };
  });

  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState('');
  const [expandedSources, setExpandedSources] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isKbOpen, setIsKbOpen] = useState(false);
  const [kbQuery, setKbQuery] = useState('');
  const [kbCategory, setKbCategory] = useState('ALL');
  const [expandedKbDoc, setExpandedKbDoc] = useState(null);
  const [vercelStatus, setVercelStatus] = useState(null);

  useEffect(() => {
    checkVercelServerlessStatus().then((res) => {
      if (res?.status === 'ok') setVercelStatus(res);
    });
  }, []);

  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'ai',
      provider: 'UIU Knowledge Base',
      text: "Hello! I'm your **UIU AI Academic Advisor** with Prompt Caching & RAG. Based on official university policies and your academic record, I can recommend clash-free course baskets, verify prerequisite readiness, check probation rules, and audit your graduation timeline. How can I help you today?",
      followUps: [
        'When can I start FYDP / Thesis?',
        'How do retakes affect my CGPA?',
        'What are the merit waiver requirements?',
      ],
      retrievedSources: [
        {
          id: 'kb_grading_scale',
          title: 'UIU Official Grading System & Grade Points',
          category: 'Academic Evaluation',
          source: 'UIU Controller of Examinations',
          confidencePct: 98,
          snippet: 'Official letter grades, percentage thresholds, and graduation CGPA requirements.',
        },
        {
          id: 'kb_retake_policy',
          title: 'Course Retake & Grade Replacement',
          category: 'Curriculum Rules',
          source: 'UIU Academic Regulations §3.4',
          confidencePct: 95,
          snippet: '50% tuition waiver for first retake. New grade completely replaces old grade in CGPA calculation.',
        },
      ],
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

  const saveProvider = (provId) => {
    setSelectedProvider(provId);
    try {
      localStorage.setItem('ez_ai_provider', provId);
      showToast(`AI Provider switched to ${AI_PROVIDERS[provId]?.name}`, 'info');
    } catch {}
  };

  const saveKeyForProvider = (provId, keyVal) => {
    const updated = { ...providerKeys, [provId]: keyVal };
    setProviderKeys(updated);
    try {
      localStorage.setItem('ez_ai_keys', JSON.stringify(updated));
      if (provId === 'openrouter') {
        localStorage.setItem('ez_openrouter_api_key', keyVal.trim());
      }
      if (provId === 'gemini') {
        localStorage.setItem('ez_gemini_api_key', keyVal.trim());
      }
      showToast(`${AI_PROVIDERS[provId]?.name} API key updated`, 'info');
    } catch {}
  };

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
        provider: 'UIU Knowledge Base',
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

  const saveModelForProvider = (provId, modelId) => {
    const updated = { ...providerModels, [provId]: modelId };
    setProviderModels(updated);
    try {
      localStorage.setItem('ez_ai_models', JSON.stringify(updated));
    } catch {}
  };

  const activeProviderConfig = AI_PROVIDERS[selectedProvider] || AI_PROVIDERS.instant;

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
    });
  }, [courses, currentCgpa, targetCredits, selectedMajor]);

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
      completedCredits,
      totalDegreeCredits: settings.programCredits || 138,
      currentTrimester: Math.min(12, Math.max(1, Math.ceil(completedCredits / 12) + 1)),
      targetTrimester: 12,
    });
  }, [completedCredits, settings.programCredits]);

  // Major Track Progress Audit (Supports 4 electives for Summer 2026+ and 3 for legacy)
  const majorStats = useMemo(() => {
    return Object.entries(MAJOR_TRACKS).map(([name, track]) => {
      const completedInTrack = track.courses.filter((c) =>
        passedCodes.has(c.course_code.toUpperCase())
      );
      const req = track.minElectives || 4;
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

    const apiKey = providerKeys[selectedProvider] || '';
    const model = providerModels[selectedProvider] || activeProviderConfig.defaultModel;

    try {
      const response = await queryUniversalAIAdvisor({
        provider: selectedProvider,
        apiKey,
        model,
        prompt: query,
        studentContext: {
          cgpa: currentCgpa,
          completedCredits,
          completedCourseCodes: Array.from(passedCodes),
          selectedMajor,
        },
        conversationHistory: chatMessages.slice(-6),
      });
      const replyText = typeof response === 'object' ? response.text : response;
      const sources = typeof response === 'object' ? response.retrievedSources : [];
      const usage = typeof response === 'object' ? response.usage : null;
      const latencyMs = typeof response === 'object' ? response.latencyMs : null;
      const isClientCached = typeof response === 'object' ? response.isClientCached : false;

      const followUps = generateFollowUpSuggestions(query, replyText);

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          provider: `${activeProviderConfig.name} (${model})`,
          text: replyText,
          retrievedSources: sources || [],
          usage,
          latencyMs,
          isClientCached,
          followUps,
        },
      ]);
    } catch (err) {
      showToast(err.message || 'Error communicating with AI provider', 'error');
      // Automatic smart fallback
      const fallback = generateAIAnswer(query, { cgpa: currentCgpa, completedCredits });
      const followUps = generateFollowUpSuggestions(query, fallback);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          provider: 'UIU Regulations Engine (Fallback)',
          text: `${fallback}\n\n*(Error contacting ${activeProviderConfig.name}: ${err.message})*`,
          retrievedSources: [],
          followUps,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const subTabs = [
    { value: 'basket', label: 'Next-Term Basket', icon: Sparkles },
    { value: 'audit', label: 'Schedule Auditor', icon: ListCheck },
    { value: 'tree', label: 'Prereq Tree', icon: GitBranch },
    { value: 'roadmap', label: 'Full Degree Plan', icon: GraduationCap },
    { value: 'majors', label: 'Major Concentrations', icon: Layers },
    { value: 'copilot', label: 'AI Copilot', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            AI Academic Advisor
          </h1>
          <p className="mt-0.5 text-xs text-ink-3">
            Course recommendations, prerequisite chains, and verified UIU policies
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Knowledge Base Browser Button */}
          <button
            onClick={() => setIsKbOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 shadow-card transition-colors hover:border-accent hover:text-accent"
            title="Browse 13 Verified UIU Statutes & Official Policies"
          >
            <BookOpen className="h-3.5 w-3.5 text-accent" />
            <span className="hidden sm:inline">UIU Statutes</span>
            <span className="rounded bg-ok/15 text-ok px-1.5 py-0.5 text-[9.5px] font-bold">
              13 Verified
            </span>
          </button>

          {/* OpenRouter AI Settings Button */}
          <button
            onClick={() => setIsAiSettingsOpen(!isAiSettingsOpen)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-card transition-colors ${
              isAiSettingsOpen
                ? 'border-accent bg-accentSoft text-accent'
                : 'border-line bg-surface text-ink-2 hover:border-accent'
            }`}
            title="Configure OpenRouter Models & Vercel Keys"
          >
            <Globe className="h-3.5 w-3.5 text-accent" />
            <span className="font-bold">{activeProviderConfig.name}</span>
            <span className="rounded bg-surface2 px-1.5 py-0.5 text-[9.5px] font-medium text-ink-3">
              {providerModels['openrouter']?.split('/')?.pop()?.replace(':free', '') || 'DeepSeek R1'}
            </span>
            <Settings2 className="h-3 w-3 opacity-60" />
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 shadow-card">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">CGPA</span>
            <span className="num font-mono text-sm font-bold text-accent">{currentCgpa.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 shadow-card">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Passed</span>
            <span className="num font-mono text-sm font-bold text-ink">{completedCredits} cr</span>
          </div>
        </div>
      </div>

      {/* Free AI Models & API Key Settings Drawer */}
      {isAiSettingsOpen && (
        <Surface className="p-5 border-accent/30 bg-surface shadow-pop fade-in">
          <div className="flex items-start justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" />
                Configure OpenRouter AI Engine
              </h3>
              <p className="text-xs text-ink-3 mt-0.5">
                Unified AI powered by OpenRouter (DeepSeek R1/V3, Llama 3.3, Gemini 2.0, Claude 3.5). On Vercel, configure OPENROUTER_API_KEY in Project Settings for 0-setup deployment.
              </p>
            </div>
            <button
              onClick={() => setIsAiSettingsOpen(false)}
              className="rounded-lg p-1.5 text-ink-3 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Provider Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {Object.values(AI_PROVIDERS).map((prov) => {
              const isSelected = selectedProvider === prov.id;
              return (
                <button
                  key={prov.id}
                  onClick={() => saveProvider(prov.id)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accentSoft shadow-sm ring-2 ring-accent/20'
                      : 'border-line bg-surface2/50 hover:bg-surface2 hover:border-line-strong'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-ink">{prov.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                  </div>
                  <span className="text-[10px] font-semibold text-accent mt-0.5">{prov.badge}</span>
                  <p className="text-[10.5px] text-ink-3 mt-1.5 line-clamp-2 leading-snug">
                    {prov.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Provider Configuration Bar */}
          <div className="mt-4 rounded-xl border border-line bg-surface2/40 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">
                    Configuring: {activeProviderConfig.name}
                  </span>
                  {activeProviderConfig.keyHelpUrl && (
                    <a
                      href={activeProviderConfig.keyHelpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
                    >
                      {activeProviderConfig.keyHelpLabel} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {vercelStatus?.configuredKeys?.[selectedProvider] ? (
                  <p className="text-xs text-ok mt-2 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-ok shrink-0" />
                    Vercel Serverless AI active: Connected via project environment variable (No client key needed).
                  </p>
                ) : activeProviderConfig.requiresKey ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="password"
                      value={providerKeys[selectedProvider] || ''}
                      onChange={(e) => saveKeyForProvider(selectedProvider, e.target.value)}
                      placeholder={activeProviderConfig.keyPlaceholder || 'Enter API Key...'}
                      className="h-9 flex-1 max-w-md rounded-xl border border-line bg-surface px-3 font-mono text-xs text-ink outline-none focus:border-accent"
                    />
                    {providerKeys[selectedProvider] && (
                      <button
                        onClick={() => saveKeyForProvider(selectedProvider, '')}
                        className="rounded-lg p-2 text-ink-3 hover:text-bad"
                        title="Clear Key"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-ok mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
                    Zero setup required! Ready to answer all your academic questions right now.
                  </p>
                )}
              </div>

              {/* Model Selector if Provider has choices */}
              {activeProviderConfig.models?.length > 1 && (
                <div className="shrink-0 w-full md:w-64">
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-ink-3 mb-1">
                    Select Model
                  </label>
                  <Select
                    value={providerModels[selectedProvider] || activeProviderConfig.defaultModel}
                    onChange={(e) => saveModelForProvider(selectedProvider, e.target.value)}
                  >
                    {activeProviderConfig.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>
        </Surface>
      )}

      {courses.length === 0 && (
        <Surface className="p-4 sm:p-5 border-accent/40 bg-accentSoft/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Upload className="h-4 w-4 text-accent" />
              No transcript connected
            </h3>
            <p className="text-xs text-ink-3 mt-0.5">
              Advising recommendations currently show freshman entry (0 completed credits). Import your UCAM report in the CGPA tab to personalize your course basket, prerequisite status, and graduation timeline.
            </p>
          </div>
        </Surface>
      )}

      <Tabs tabs={subTabs} value={activeTab} onChange={setActiveTab} layoutId="advisor-subtabs" />

      {/* ================= MODE 1: NEXT-TERM BASKET ================= */}
      {activeTab === 'basket' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 pop-in">
          {/* Controls & Diagnostics */}
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
                        className={`rounded-xl border py-2 text-xs font-bold transition-colors duration-150 ${
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
                  <span className={`font-bold ${courses.length === 0 ? 'text-ink-3' : basketAnalysis.workloadColor}`}>
                    {courses.length === 0 ? '—' : basketAnalysis.workloadGrade}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-2">Eligible Unlocked Courses:</span>
                  <span className="num font-bold text-ink">
                    {courses.length === 0 ? '0 courses' : `${basketAnalysis.eligibleCount} courses`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-2">Final Exam Slot Conflicts:</span>
                  <span className="num font-bold text-ok">
                    {courses.length === 0
                      ? '—'
                      : basketAnalysis.examConflicts.length === 0
                      ? '0 Clashes (Safe)'
                      : `${basketAnalysis.examConflicts.length} Clashes`}
                  </span>
                </div>
                {courses.length > 0 && basketAnalysis.tightExams?.length > 0 && (
                  <div className="text-[11px] text-warn flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{basketAnalysis.tightExams[0].desc}</span>
                  </div>
                )}
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

            {courses.length === 0 ? (
              <Surface className="p-8 text-center flex flex-col items-center justify-center border-accent/30 bg-accentSoft/20">
                <GraduationCap className="h-8 w-8 text-accent mb-2" />
                <p className="text-sm font-bold text-ink">No academic transcript connected</p>
                <p className="mt-1 text-xs text-ink-3 max-w-sm">
                  Import your UCAM grade report in the CGPA tab to calculate your personalized next-term course recommendations and prerequisite paths.
                </p>
              </Surface>
            ) : basketAnalysis.basket.length === 0 ? (
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
        </div>
      )}

      {/* ================= MODE 2: CUSTOM SCHEDULE AUDITOR ================= */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 pop-in">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Surface className="p-5">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">
                Schedule Stress-Tester
              </h3>
              <p className="text-xs text-ink-3 mt-1">
                Select courses you plan to take together. The auditor verifies prerequisites, final exam
                clashes, and cumulative difficulty.
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
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  Courses Selected for Audit ({auditSelectedCodes.length}):
                </div>
                {auditSelectedCodes.length === 0 ? (
                  <p className="text-xs text-ink-3 py-1">
                    No courses added yet. Pick a course above to audit exam slots and prerequisites.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {auditSelectedCodes.map((code) => (
                      <span
                        key={code}
                        className="flex items-center gap-1.5 rounded-xl border border-line bg-surface2 px-2.5 py-1 text-xs font-bold text-ink"
                      >
                        {code}
                        <button
                          onClick={() =>
                            setAuditSelectedCodes(auditSelectedCodes.filter((c) => c !== code))
                          }
                          className="text-ink-3 hover:text-bad"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-5 border-t border-line pt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  Quick Actions:
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {basketAnalysis.basket.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setAuditSelectedCodes(basketAnalysis.basket.map((c) => c.course_code))
                      }
                      className="rounded-lg border border-accent/40 bg-accentSoft/60 px-2.5 py-1 text-[11px] font-bold text-accent hover:border-accent"
                    >
                      Audit Recommended Basket ({basketAnalysis.basket.length} courses)
                    </button>
                  )}
                  {getSavedRoutine().length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setAuditSelectedCodes(getSavedRoutine().map((c) => c.code))
                      }
                      className="rounded-lg border border-line bg-surface2/60 px-2.5 py-1 text-[11px] font-medium text-ink-2 hover:text-ink"
                    >
                      Audit Saved Routine ({getSavedRoutine().length} courses)
                    </button>
                  )}
                  {auditSelectedCodes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAuditSelectedCodes([])}
                      className="rounded-lg border border-line bg-surface2/60 px-2.5 py-1 text-[11px] font-medium text-ink-3 hover:text-bad"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>
            </Surface>
          </div>

          {/* Audit Results Panel */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Surface className="p-5">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Audit Verdict
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    customAudit.isValid
                      ? 'bg-ok/15 text-ok border border-ok/30'
                      : 'bg-bad/15 text-bad border border-bad/30'
                  }`}
                >
                  {customAudit.isValid ? 'Approved (Safe to Register)' : 'Issues Detected'}
                </span>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="rounded-xl border border-line bg-surface2/40 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                    Total Credits
                  </span>
                  <div className="num mt-1 text-lg font-extrabold text-ink">
                    {customAudit.totalCredits} cr
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface2/40 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                    Hard Courses
                  </span>
                  <div className="num mt-1 text-lg font-extrabold text-warn">
                    {customAudit.hardCount}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface2/40 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                    Exam Clashes
                  </span>
                  <div className="num mt-1 text-lg font-extrabold text-ok">
                    {customAudit.examConflicts.length}
                  </div>
                </div>
              </div>

              {/* Blocked or Warning Messages */}
              {customAudit.blockedCourses.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h4 className="text-xs font-bold text-bad flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Prerequisite Issues:
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
                    Final Exam Collision:
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
                <h4 className="text-xs font-bold text-ink-2">Valid Courses:</h4>
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
            <Surface className="p-5">
              <h3 className="text-[15px] font-bold tracking-tight text-ink flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-accent" />
                Course Prerequisite Explorer
              </h3>
              <p className="text-xs text-ink-3 mt-1">
                Select any course to trace its complete upstream prerequisite chain and see what is
                already passed vs. still missing.
              </p>

              <div className="mt-4">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                  Target Course
                </label>
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
              </div>

              {/* Quick Jump Buttons */}
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  High-Impact Capstones to Explore:
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['CSE 4889', 'CSE 4611', 'CSE 4783', 'CSE 4587', 'CSE 3811', 'CSE 3411'].map(
                    (code) => (
                      <button
                        key={code}
                        onClick={() => setSelectedTreeCourse(code)}
                        className={`rounded-lg border px-2 py-1 text-xs font-mono font-bold transition-colors duration-150 ${
                          selectedTreeCourse === code
                            ? 'border-accent bg-accentSoft text-accent'
                            : 'border-line bg-surface2 text-ink-2 hover:text-ink'
                        }`}
                      >
                        {code}
                      </button>
                    )
                  )}
                </div>
              </div>
            </Surface>
          </div>

          {/* Tree Visualization Card */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Surface className="p-5">
              {prereqTree && (
                <div>
                  <div className="flex items-start justify-between border-b border-line pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-extrabold text-accent">
                          {prereqTree.target.course_code}
                        </span>
                        <span className="rounded-md border border-line bg-surface2 px-1.5 py-0.5 text-xs font-bold text-ink">
                          {prereqTree.target.credit} cr
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-ink mt-0.5">
                        {prereqTree.target.course_name}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        prereqTree.isTargetPassed
                          ? 'bg-ok/15 text-ok border border-ok/30'
                          : prereqTree.arePrereqsMet
                            ? 'bg-accentSoft text-accent border border-accent/30'
                            : 'bg-bad/15 text-bad border border-bad/30'
                      }`}
                    >
                      {prereqTree.isTargetPassed
                        ? 'Passed Already'
                        : prereqTree.arePrereqsMet
                          ? 'Unlocked & Ready to Take'
                          : 'Locked by Prerequisites'}
                    </span>
                  </div>

                  {/* Chain List */}
                  <div className="mt-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3">
                      Required Upstream Chain ({prereqTree.prerequisitesList.length} prerequisite courses):
                    </h4>

                    {prereqTree.prerequisitesList.length === 0 ? (
                      <div className="rounded-xl border border-line bg-surface2/40 p-4 text-xs text-ink-3 text-center">
                        This is an entry-level course with zero prerequisites. You can take it anytime!
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
                {timeline.fydpEligible ? 'Ready for CSE 4000A' : 'Credits left to reach 80 cr'}
              </div>
            </Surface>
          </div>

          {/* FYDP Milestone Card */}
          <Surface className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-accent" />
                  <h3 className="text-base font-bold text-ink">
                    Final Year Design Project (FYDP I / CSE 4000A) Gatekeeper
                  </h3>
                </div>
                <p className="mt-1 text-xs text-ink-2 max-w-2xl">
                  UIU Department of CSE requires **80 credits completed** before enrollment in FYDP I.
                  {timeline.fydpEligible
                    ? ' You have crossed the 80-credit mark! You are authorized to register for CSE 4000A.'
                    : ` You currently need ${timeline.creditsToFydp} more credits to qualify.`}
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-64">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-ink-3">Progress to 80 cr</span>
                  <span className="num text-accent">
                    {Math.min(80, timeline.safeCompleted)} / 80 cr
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent2 transition-[width] duration-700"
                    style={{ width: `${Math.min(100, (timeline.safeCompleted / 80) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Surface>

          {/* Multi-Term Semester Roadmap Grid */}
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">
                Automated Multi-Trimester Degree Plan
              </h3>
              <span className="text-xs text-ink-3">
                Calculated up to Trimester 12 under {targetCredits} cr/term
              </span>
            </div>

            {courses.length === 0 ? (
              <Surface className="p-8 text-center flex flex-col items-center justify-center border-accent/30 bg-accentSoft/20">
                <GraduationCap className="h-8 w-8 text-accent mb-2" />
                <p className="text-sm font-bold text-ink">No academic transcript connected</p>
                <p className="mt-1 text-xs text-ink-3 max-w-sm">
                  Connect your completed transcript in the CGPA tab to calculate your personalized degree roadmap and milestone timeline.
                </p>
              </Surface>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {fullDegreeRoadmap.map((sem) => (
                <Surface hover key={sem.trimesterNum} className="p-4">
                  <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                    <span className="font-bold text-accent text-sm">{sem.title}</span>
                    <span className="num font-bold text-xs rounded-md bg-surface2 px-2 py-0.5 text-ink-2">
                      {sem.credits} Credits
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {sem.courses.map((c) => (
                      <div
                        key={c.course_code}
                        className="flex items-center justify-between text-xs rounded-lg p-1.5 hover:bg-surface2/60"
                      >
                        <div className="truncate min-w-0 mr-2">
                          <span className="font-mono font-bold text-accent mr-1.5">
                            {c.course_code}
                          </span>
                          <span className="text-ink truncate">{c.course_name}</span>
                        </div>
                        <span className="text-ink-3 shrink-0 font-mono">{c.credit} cr</span>
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
              <button
                key={chip}
                onClick={() => handleSendQuery(chip)}
                className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 shadow-sm transition-[color,background-color,border-color,transform] duration-150 ease-out hover:border-accent hover:text-accent active:scale-[0.96]"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Active Model Indicator Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-ink-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-accent" />
                Active AI: <b className="text-ink font-semibold">{activeProviderConfig.name}</b>
                <span className="text-[11px] text-accent">({providerModels[selectedProvider] || activeProviderConfig.defaultModel})</span>
              </span>
              {selectedProvider === 'openrouter' && (
                <span className="rounded bg-ok/15 text-ok border border-ok/30 px-1.5 py-0.5 text-[9.5px] font-bold flex items-center gap-1">
                  <Flame className="h-2.5 w-2.5" /> Prompt Caching Ready
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsKbOpen(true)}
                className="text-[11px] text-accent hover:underline flex items-center gap-1 font-semibold"
              >
                <BookOpen className="h-3 w-3" /> 13 UIU Statutes
              </button>
              <button
                onClick={handleClearChat}
                className="text-[11px] text-ink-3 hover:text-bad flex items-center gap-1 transition-colors"
                title="Clear conversation history"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
              <button
                onClick={() => setIsAiSettingsOpen(true)}
                className="text-[11px] text-ink-2 hover:text-ink flex items-center gap-1 font-semibold"
              >
                Settings <Settings2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Dedicated OpenRouter API Key Activation Bar if Empty */}
          {selectedProvider === 'openrouter' && !providerKeys.openrouter && (
            <Surface className="p-4 border-accent/40 bg-accentSoft shadow-sm fade-in">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-accent" />
                    Enter Your OpenRouter API Key
                  </h4>
                  <p className="text-[11px] text-ink-3 mt-0.5">
                    Paste your OpenRouter key here to activate high-speed DeepSeek R1 & prompt caching.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={openRouterKeyInput}
                    onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                    className="h-9 w-44 sm:w-56 rounded-xl border border-line bg-surface px-3 font-mono text-xs text-ink outline-none focus:border-accent"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!openRouterKeyInput.trim()}
                    onClick={() => {
                      saveKeyForProvider('openrouter', openRouterKeyInput);
                      setOpenRouterKeyInput('');
                    }}
                  >
                    Save & Activate
                  </Button>
                </div>
              </div>
            </Surface>
          )}

          {/* Chat Messages Log */}
          <Surface className="p-4 sm:p-5 min-h-[340px] max-h-[500px] overflow-y-auto overscroll-contain space-y-4">
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
                  {/* Top Bar for AI Response */}
                  {msg.role === 'ai' && (
                    <div className="flex items-center justify-between gap-2 border-b border-line/40 pb-1.5 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {msg.provider && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent opacity-90">
                            {msg.provider}
                          </span>
                        )}
                        {msg.isClientCached && (
                          <span className="rounded bg-accentSoft text-accent border border-accent/25 px-1.5 py-0.5 text-[9.5px] font-bold flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5" /> 0ms Cached
                          </span>
                        )}
                        {msg.usage?.cachedTokens > 0 && (
                          <span className="rounded bg-ok/15 text-ok border border-ok/30 px-1.5 py-0.5 text-[9.5px] font-bold flex items-center gap-0.5">
                            <Flame className="h-2.5 w-2.5" /> {msg.usage.cachedTokens} Tokens Cached
                          </span>
                        )}
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

                  <div className="whitespace-pre-line">{msg.text}</div>

                  {/* Contextual Suggested Follow-up Chips */}
                  {msg.followUps && msg.followUps.length > 0 && (
                    <div className="mt-3 border-t border-line/60 pt-2 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-ink-3 font-semibold mr-1">Follow-up:</span>
                      {msg.followUps.map((fu, fuIdx) => (
                        <button
                          key={fuIdx}
                          onClick={() => handleSendQuery(fu)}
                          className="rounded-lg border border-line bg-surface/90 px-2 py-0.5 text-[10.5px] font-medium text-ink-2 hover:border-accent hover:text-accent hover:bg-accentSoft transition-colors"
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* RAG Retrieved Sources Inspector */}
                  {msg.retrievedSources && msg.retrievedSources.length > 0 && (
                    <div className="mt-2.5 border-t border-line/60 pt-2">
                      <button
                        type="button"
                        onClick={() => toggleSourceExpansion(i)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accentSoft px-2.5 py-1 text-[11px] font-semibold text-accent hover:border-accent transition-colors shadow-sm"
                      >
                        <BookOpen className="h-3 w-3 text-accent" />
                        <span>{msg.retrievedSources.length} Official UIU Policy Sources Cited</span>
                        {msg.retrievedSources[0]?.confidencePct && (
                          <span className="text-[10px] font-mono opacity-80">
                            ({msg.retrievedSources[0].confidencePct}% match)
                          </span>
                        )}
                        <ChevronDown
                          className={`h-3 w-3 transition-transform duration-200 ${
                            expandedSources[i] ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedSources[i] && (
                        <div className="mt-2 space-y-2 fade-in">
                          {msg.retrievedSources.map((src) => (
                            <div
                              key={src.id}
                              className="rounded-xl border border-line bg-surface p-3 text-xs shadow-card"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-ink text-[12px] flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-ok shrink-0" />
                                    {src.title}
                                  </div>
                                  <div className="text-[10.5px] text-ink-3 mt-0.5">
                                    Authority: <span className="text-ink-2 font-medium">{src.source}</span> · Category: {src.category}
                                  </div>
                                </div>
                                {src.confidencePct && (
                                  <span className="rounded-md bg-ok/15 text-ok border border-ok/30 px-1.5 py-0.5 text-[9.5px] font-bold shrink-0">
                                    {src.confidencePct}% match
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 rounded-lg bg-surface2/60 p-2.5 text-[11px] leading-relaxed text-ink font-mono border border-line/60">
                                "{src.snippet}"
                              </p>
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
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent to-accent2 p-1.5 text-white shrink-0 shadow-md">
                  <Sparkles className="h-full w-full animate-spin" />
                </div>
                <div className="rounded-2xl px-4 py-3 text-xs border border-line bg-surface2/60 text-ink-3 italic">
                  {activeProviderConfig.name} is retrieving UIU statutes & generating advice…
                </div>
              </div>
            )}
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
        sub="13 verified official policy documents indexed for Retrieval-Augmented Generation (RAG)"
        width="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Search Bar & Category Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
              <input
                type="text"
                value={kbQuery}
                onChange={(e) => setKbQuery(e.target.value)}
                placeholder="Search across all 13 verified UIU statutes, exam rules, waivers, or FYDP..."
                className="h-10 w-full rounded-xl border border-line bg-surface2/60 pl-10 pr-4 text-xs text-ink placeholder-ink-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              {kbQuery && (
                <button
                  onClick={() => setKbQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-3 hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
              {kbCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setKbCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    kbCategory === cat
                      ? 'bg-accentSoft text-accent border border-accent/40 font-bold'
                      : 'bg-surface2 text-ink-3 hover:text-ink border border-line'
                  }`}
                >
                  {cat === 'ALL' ? 'All Policies (13)' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Documents List */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
            {filteredKbDocs.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface2/30 p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-ink-3 opacity-60" />
                <p className="mt-2 text-xs font-semibold text-ink-2">No matching policy clauses found</p>
                <p className="text-[11px] text-ink-3">Try adjusting your search terms or selecting 'All Policies'</p>
              </div>
            ) : (
              filteredKbDocs.map((doc) => {
                const isExpanded = expandedKbDoc === doc.id;
                return (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-line-strong"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-accentSoft text-accent px-2 py-0.5 text-[10px] font-bold">
                            {doc.category}
                          </span>
                          <span className="text-[10.5px] text-ink-3 font-mono">
                            Authority: {doc.source}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-bold text-ink">{doc.title}</h4>
                        <p className="mt-1 text-xs text-ink-2 leading-relaxed">{doc.summary}</p>
                      </div>

                      <button
                        onClick={() => setExpandedKbDoc(isExpanded ? null : doc.id)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold shrink-0 transition-colors ${
                          isExpanded
                            ? 'border-accent bg-accentSoft text-accent'
                            : 'border-line bg-surface2 text-ink-2 hover:text-ink'
                        }`}
                      >
                        {isExpanded ? 'Hide Full Clause' : 'View Full Clause'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3.5 border-t border-line/60 pt-3 fade-in">
                        <div className="rounded-xl border border-line/80 bg-surface2/60 p-3.5 font-mono text-[11.5px] leading-relaxed text-ink whitespace-pre-line">
                          {doc.content}
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          <span className="text-[10px] text-ink-3 uppercase tracking-wider font-semibold mr-1 self-center">
                            Indexed Keywords:
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
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
