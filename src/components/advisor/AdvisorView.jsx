/**
 * AI Advisor
 *
 * A chat with the academic advisor. The student asks a question in their own
 * words - "my cgpa is low what can i take", "how do i recover from probation",
 * "admission can be cancelled" - and gets an answer grounded in the verified
 * UIU policy clauses and their own academic record.
 *
 * The deterministic tools (course basket, schedule auditor, prerequisite tree,
 * degree plan, tracks) live in their own page, `AcademicToolsView`. This page
 * is only the conversation.
 */

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Send,
  ShieldCheck,
  Check,
  ChevronDown,
  Bot,
  Globe,
  Search,
  FileText,
  Copy,
  Trash2,
  Upload,
} from 'lucide-react';
import Button from '../ui/Button';
import Surface from '../ui/Surface';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Chip from '../ui/Chip';
import Input from '../ui/Input';
import Empty from '../ui/Empty';
import { type } from '../ui/tokens';
import Modal from '../ui/Modal';
import ChatText from './ChatText';
import {
  generateFollowUpSuggestions,
  queryUniversalAIAdvisor,
  getPassedCoursesSet,
  calculateDegreeTimeline,
} from '../../utils/advisorEngine';
import { UIU_KNOWLEDGE_DOCUMENTS } from '../../data/uiuKnowledgeBase';
import { calculateAcademicMetrics, getEffectiveCourses } from '../../utils/cgpaUtils';
import { useToast } from '../../context/ToastContext';

export default function AdvisorView({
  courses = [],
  settings = {},
}) {
  const { showToast } = useToast();
  const [selectedMajor] = useState('Software Engineering');

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
      text: 'Ask me anything about your degree - probation and recovery, what to take next, retakes, waivers, FYDP, tuition or deadlines. Every answer cites the official UIU policy.',
      followUps: [
        'How do I recover from probation?',
        'My CGPA is low, what can I take?',
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
        text: 'Conversation reset. Ask me anything about your degree - probation, recovery, what to take next, retakes, waivers or FYDP.',
        followUps: [
          'How do I recover from probation?',
          'My CGPA is low, what can I take?',
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

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={type.pageTitle}>AI Advisor</h1>
          <p className={`${type.small} mt-0.5`}>
            Ask about your degree in your own words - every answer cites the official UIU policy
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
        <Surface
          tone="accent"
          className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accentSoft text-accent">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className={type.cardTitle}>No transcript connected</h3>
              <p className={`${type.small} mt-0.5`}>
                The advisor is answering from the published UIU policy only. Import your UCam
                report in the CGPA tab and it will also use your own CGPA, credits and completed
                courses to give you personalised guidance.
              </p>
            </div>
          </div>
        </Surface>
      )}

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
