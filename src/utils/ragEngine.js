/**
 * EZ_UIU - Client-side RAG (Retrieval-Augmented Generation) Engine
 *
 * Retrieval runs entirely in the browser over the verified UIU knowledge base.
 * The pipeline is:
 *
 *   query -> normalise -> intent route -> BM25 over clause chunks
 *         -> clause-level MMR diversification -> verified citations
 *
 * Two properties matter more than raw recall:
 *
 *   1. Clause granularity. Each document is split into individually quotable
 *      clauses so a citation shows the exact rule that was retrieved, not the
 *      whole page. A snippet that contains the answer is worth more than a
 *      long snippet that contains it somewhere.
 *
 *   2. Honesty about coverage. If nothing clears the relevance floor, the
 *      engine returns no documents and the advisor says the published UIU
 *      documents do not cover the question. It never returns the "least bad"
 *      document as if it were an answer.
 *
 * Every returned citation carries the official source URL and the month the
 * clause was last checked, so the UI can link straight back to the page.
 */

import { UIU_KNOWLEDGE_DOCUMENTS } from '../data/uiuKnowledgeBase';

/* ------------------------------------------------------------------ *
 * Text normalisation
 * ------------------------------------------------------------------ */

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'do', 'does',
  'for', 'from', 'has', 'have', 'how', 'i', 'if', 'in', 'is', 'it', 'me', 'my',
  'of', 'on', 'or', 'our', 'so', 'that', 'the', 'their', 'them', 'then',
  'there', 'these', 'they', 'this', 'to', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'who', 'will', 'with', 'would', 'you', 'your',
]);

/**
 * Domain synonyms. Each key expands to terms that appear in the official
 * clause text, so a student question like "can I redo a failed course" can
 * reach the "Repeat & Retake of Courses" clause.
 */
const UIU_SYNONYMS = {
  fydp: ['fydp', 'thesis', 'capstone', 'final year design project', 'project i', 'supervisor', 'mentor'],
  thesis: ['fydp', 'thesis', 'capstone', 'final year design project', 'supervisor', 'mentor'],
  capstone: ['fydp', 'thesis', 'capstone', 'final year design project'],
  waiver: ['waiver', 'scholarship', 'discount', 'financial aid', 'tuition fee waiver'],
  scholarship: ['waiver', 'scholarship', 'merit', 'tuition fee waiver'],
  merit: ['merit', 'scholarship', 'waiver', 'top 2%', 'next 4%', 'rank'],
  retake: ['retake', 'repeat', 'improvement exam', 'r'],
  repeat: ['repeat', 'retake', 'r', 'transcript'],
  fail: ['f', 'fail', 'repeat', 'dismissal', 'probation'],
  failing: ['f', 'fail', 'probation', 'dismissal'],
  probation: ['probation', 'dismissal', 'low cgpa', 'cgpa 2.0', 'third probation', 'special consideration'],
  dismissal: ['dismissal', 'probation', 'academic dismissal'],
  fee: ['tuition', 'cost', 'installment', 'per credit', 'payment', '6500', '5525'],
  tuition: ['fee', 'installment', 'per credit', '6500', '5525'],
  installment: ['installment', 'payment schedule', '40%', '30%', 'first installment'],
  honors: ['laude', 'convocation', 'distinction'],
  laude: ['laude', 'convocation', 'distinction'],
  convocation: ['convocation', 'laude', 'graduation', 'degree'],
  attendance: ['attendance', 'absent', '80%', 'debarred', 'final exam eligibility'],
  absent: ['attendance', 'absent', '80%'],
  exam: ['final exam', 'exam slot', 't1', 't2', 't3', 'schedule', 'mid-term'],
  slot: ['exam slot', 't1', 't2', 't3', 'exam day'],
  track: ['specialization', 'major', 'elective courses', 'electives'],
  major: ['specialization', 'major', 'elective courses', 'electives'],
  specialization: ['specialization', 'major', 'elective courses', 'electives'],
  credits: ['credit hours', 'degree requirement', 'curriculum', '141', '138'],
  credit: ['credit hours', 'credit', 'curriculum'],
  curriculum: ['curriculum', 'course plan', 'trimester', 'credit', 'elective'],
  register: ['registration', 'ucam', 'advising', 'pre-advising', 'register'],
  registration: ['registration', 'ucam', 'advising', 'register'],
  advising: ['advising', 'advisor', 'registration'],
  withdraw: ['w', 'withdrawal', 'withdrawn', 'course withdrawal'],
  incomplete: ['incomplete', 'grade', 'reverts to f'],
  internship: ['internship', 'cse 3542', 'industry internship'],
  selfstudy: ['self-study', 'self study', '20 credits'],
  transport: ['transportation', 'shuttle', 'bus', 'transportation fee'],
  shuttle: ['shuttle', 'transportation', 'bus'],
  grading: ['grade', 'grade point', 'gpa', 'cgpa', 'marks'],
  cgpa: ['cgpa', 'gpa', 'grade point', '2.0'],
  gpa: ['gpa', 'cgpa', 'grade point'],
  dropping: ['drop', 'refund', 'add-drop'],
  refund: ['refund', 'drop', 'adjustable'],
  internship2: ['internship', 'cse 3542'],
  hospitalization: ['hospital', 'medical', 'sickness'],
};

/** Light suffix stemmer - enough to match plural/singular policy nouns. */
function stem(word) {
  if (word.length <= 4) return word;
  for (const suffix of ['ies', 'es', 's']) {
    if (word.endsWith(suffix)) {
      if (suffix === 'ies') return `${word.slice(0, -3)}y`;
      if (suffix === 'es' && !/[sxzh]es$/.test(word)) return word.slice(0, -2);
      if (suffix === 's' && !word.endsWith('ss')) return word.slice(0, -1);
    }
  }
  return word;
}

/**
 * Tokenise a string into normalised terms, expanding UIU synonyms.
 *
 * Course codes such as "CSE 1115" are split into their two parts so that a
 * query for a course still matches the code in a clause. Filler words that
 * carry no policy meaning are dropped, and a URL fragment never contributes
 * tokens.
 */
export function tokenizeQuery(text = '') {
  // Drop anything that looks like a URL before tokenising, so a source link
  // never supplies retrieval terms.
  const withoutUrls = String(text).replace(/https?:\/\/\S+/gi, ' ');

  const clean = withoutUrls
    .toLowerCase()
    .replace(/[^a-z0-9\s%.\-]/g, ' ')
    .replace(/\b([a-z]{2,4})\s?(\d{4}[a-z]?)\b/g, ' $1 $2 ')
    .trim();

  const raw = clean.split(/\s+/).filter(Boolean);
  const tokens = [];

  for (const term of raw) {
    if (term.length < 2) continue;
    const stemmed = stem(term);
    tokens.push(stemmed);
    if (STOPWORDS.has(term)) continue;
    const expansions = UIU_SYNONYMS[term];
    if (expansions) {
      for (const expansion of expansions) {
        for (const part of expansion.split(/\s+/)) {
          if (part.length >= 2) tokens.push(stem(part));
        }
      }
    }
  }

  return tokens;
}

/* ------------------------------------------------------------------ *
 * Intent routing
 * ------------------------------------------------------------------ */

const INTENT_RULES = [
  {
    intent: 'grading',
    terms: [
      'grade',
      'grading',
      'marks',
      'percentage',
      'gpa',
      'cgpa',
      'cg',
      'letter grade',
      'grade point',
      'earned credit',
      'improve my cgpa',
      'raise my cgpa',
      'boost my cgpa',
      'my cgpa is low',
      'my cg is low',
      'low cgpa',
      'how do i improve',
      'how can i improve',
    ],
  },
  {
    intent: 'probation',
    terms: [
      'probation',
      'dismissal',
      'dismissed',
      'suspended',
      'low cgpa',
      'warning letter',
      'third probation',
      'recover from probation',
      'come out of probation',
      'get off probation',
      'remove probation',
      'clear probation',
      'on probation',
      'probation status',
      'poor academic standing',
      'academic standing',
      'admission cancel',
      'cancel admission',
      'admission cancelled',
      'admission canceled',
      'cancel my admission',
      'revoke admission',
      'boot',
      'booting',
      'kicked out',
      'kick out',
      'removed from the university',
      'removed from uiu',
    ],
  },
  {
    intent: 'waiver',
    terms: ['waiver', 'scholarship', 'merit', 'discount', 'financial aid', 'top 2%', 'next 4%', 'sibling', 'freedom fighter'],
  },
  {
    intent: 'fees',
    terms: ['fee', 'fees', 'tuition', 'cost', 'installment', 'payment', 'per credit', '6500', '5525', 'caution money', 'admission fee'],
  },
  {
    intent: 'fydp',
    terms: ['fydp', 'thesis', 'capstone', 'project i', 'project ii', 'project iii', 'final year design project', 'supervisor', 'mentor', '4000a', '4000b', '4000c'],
  },
  {
    intent: 'curriculum',
    terms: [
      'curriculum',
      'course plan',
      'credit requirement',
      'total credit',
      'how many credit',
      'degree requirement',
      'specialization',
      'major',
      'track',
      'elective',
      'what can i take',
      'what should i take',
      'which course should i take',
      'which courses should i take',
      'what courses can i take',
      'course recommendation',
      'recommend me a course',
      'suggest a course',
      'next course',
      'next trimester course',
    ],
  },
  {
    intent: 'exam',
    terms: ['exam', 'slot', 't1', 't2', 't3', 'clash', 'collision', 'routine', 'schedule'],
  },
  {
    intent: 'registration',
    terms: [
      'register',
      'registration',
      'advising',
      'ucam',
      'add drop',
      'drop date',
      'late registration',
      'fine',
      'minimum credit',
      'credit load',
      'how many credit should i take',
      'how many courses should i take',
      'course load',
      'semester load',
      'trimester load',
    ],
  },
  {
    intent: 'attendance',
    terms: ['attendance', 'absent', 'present', 'debarred'],
  },
  {
    intent: 'retake',
    terms: [
      'retake',
      'repeat',
      'improve my grade',
      'backlog',
      'resit',
      'r mark',
      'grade replacement',
      'fail a course',
      'failed a course',
      'failing a course',
      'failed course',
      'f grade',
      'got an f',
      'did i fail',
      'failing',
      'fail',
    ],
  },
  {
    intent: 'withdrawal',
    terms: ['withdraw', 'withdrawal', 'incomplete grade', 'grade change', 'drop the trimester', 'w grade'],
  },
  {
    intent: 'internship',
    terms: ['internship', 'industry internship', 'industrial attachment', '3542'],
  },
  {
    intent: 'transport',
    terms: ['transport', 'shuttle', 'bus', 'transportation'],
  },
  {
    intent: 'selfstudy',
    terms: ['self-study', 'self study', '20 credits'],
  },
  {
    intent: 'honors',
    terms: ['honors', 'honours', 'laude', 'summa', 'magna', 'convocation', 'gold medal'],
  },
];

/**
 * Intents that own a specific subject. When two intents match a question, the
 * more specific one wins even if the generic one scored slightly higher.
 */
const INTENT_SPECIFICITY = {
  fydp: 3,
  honors: 3,
  selfstudy: 3,
  internship: 3,
  retake: 2,
  probation: 2,
  attendance: 2,
  transport: 2,
  withdrawal: 2,
  exam: 2,
  waiver: 2,
  registration: 1,
  grading: 1,
  fees: 1,
  curriculum: 1,
};

/**
 * Classify the question into policy intents so that the matching clause is
 * boosted above a generic keyword match.
 *
 * A question can name two subjects, for example "how many credits before
 * FYDP-I". Both intents fire, and the specificity ranking decides which
 * document is treated as the primary one.
 */
export function detectIntent(query = '') {
  const q = String(query).toLowerCase();
  const scores = new Map();

  for (const rule of INTENT_RULES) {
    let score = 0;
    for (const term of rule.terms) {
      if (matchesTerm(q, term)) score += term.includes(' ') ? 3 : 2;
    }
    if (score > 0) scores.set(rule.intent, score);
  }

  return [...scores.entries()]
    .map(([intent, score]) => ({ intent, score, specificity: INTENT_SPECIFICITY[intent] || 1 }))
    .sort((a, b) => {
      // Specific subjects outrank generic ones.
      if (b.specificity !== a.specificity) return b.specificity - a.specificity;
      return b.score - a.score;
    });
}

/**
 * Does the query contain the term as a whole phrase?
 *
 * Plain `includes` fails on the way students actually phrase things:
 * "admission can be cancelled" does not contain the substring "admission
 * cancel", because "can be" sits in between. Matching on word boundaries
 * instead lets the words be adjacent in any order within a short window.
 */
function matchesTerm(query, term) {
  if (!term) return false;
  if (!term.includes(' ')) {
    return new RegExp(`\\b${escapeRegExp(term)}\\w*\\b`, 'i').test(query);
  }

  const words = term.split(' ').map((w) => escapeRegExp(w) + '\\w*');
  // Allow up to two intervening words between the terms of a phrase.
  const pattern = words.join('(?:\\s+\\w+){0,2}\\s+');
  return new RegExp(`\\b${pattern}\\b`, 'i').test(query);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ------------------------------------------------------------------ *
 * Clause chunking
 * ------------------------------------------------------------------ */

const MAX_CLAUSE_CHARS = 1400;
const MIN_CLAUSE_CHARS = 30;

/**
 * Split a document into independently retrievable clauses.
 *
 * A clause ends at a blank line or at a heading line. Pipe-table rows stay
 * together with their header, because a grading row without its header is
 * meaningless. Long clauses are split on line boundaries.
 */
function chunkIntoClauses(content) {
  const blocks = String(content)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const clauses = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const isTable = lines.every((l) => l.includes(' | ') || l.includes('---'));

    if (isTable && lines.length > 1) {
      // Keep a table intact unless it is unreasonably long.
      if (block.length <= MAX_CLAUSE_CHARS) {
        clauses.push(block);
        continue;
      }
      const header = lines[0];
      let buffer = header;
      for (let i = 1; i < lines.length; i++) {
        if (buffer.length + lines[i].length + 1 > MAX_CLAUSE_CHARS) {
          clauses.push(buffer);
          buffer = header + '\n' + lines[i];
        } else {
          buffer += '\n' + lines[i];
        }
      }
      if (buffer.trim()) clauses.push(buffer);
      continue;
    }

    if (block.length <= MAX_CLAUSE_CHARS) {
      clauses.push(block);
      continue;
    }

    // Long prose clause: split on line boundaries.
    let buffer = '';
    for (const line of lines) {
      if (buffer.length + line.length + 1 > MAX_CLAUSE_CHARS && buffer) {
        clauses.push(buffer);
        buffer = line;
      } else {
        buffer += (buffer ? '\n' : '') + line;
      }
    }
    if (buffer.trim()) clauses.push(buffer);
  }

  return clauses.filter((c) => c.length >= MIN_CLAUSE_CHARS);
}

/* ------------------------------------------------------------------ *
 * BM25 index
 * ------------------------------------------------------------------ */

const K1 = 1.5;
const B = 0.75;

/** Pre-computed retrieval index over every clause of every knowledge document. */
const INDEX = (() => {
  const clauses = [];
  const docs = new Map();

  for (const doc of UIU_KNOWLEDGE_DOCUMENTS) {
    const docClauses = chunkIntoClauses(doc.content);
    const clauseIds = [];

    docClauses.forEach((text, i) => {
      const tokens = tokenizeQuery(text);
      const clause = {
        id: `${doc.id}#${i}`,
        docId: doc.id,
        clauseIndex: i,
        text,
        tokens,
        tf: new Map(),
        length: tokens.length,
      };
      for (const token of tokens) {
        clause.tf.set(token, (clause.tf.get(token) || 0) + 1);
      }
      clauseIds.push(clauses.length);
      clauses.push(clause);
    });

    docs.set(doc.id, {
      id: doc.id,
      clauseIds,
      fieldTokens: [
        ...tokenizeQuery(doc.title),
        ...tokenizeQuery(doc.summary),
        ...tokenizeQuery(doc.keywords.join(' ')),
      ],
    });
  }

  const docFreq = new Map();
  for (const clause of clauses) {
    for (const token of new Set(clause.tokens)) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  const avgLength =
    clauses.reduce((sum, c) => sum + c.length, 0) / Math.max(1, clauses.length);

  return { clauses, docs, docFreq, avgLength };
})();

/**
 * BM25 score of one unit against a query term list.
 */
function bm25Score(unit, queryTokens, docFreq, totalUnits, avgLength) {
  let score = 0;
  for (const token of queryTokens) {
    const tf = unit.tf.get(token);
    if (!tf) continue;
    const n = docFreq.get(token) || 0;
    const idf = Math.log(1 + (totalUnits - n + 0.5) / (n + 0.5));
    const norm = tf * (K1 + 1);
    const denom = tf + K1 * (1 - B + (B * unit.length) / avgLength);
    score += idf * (norm / denom);
  }
  return score;
}

/* ------------------------------------------------------------------ *
 * Retrieval
 * ------------------------------------------------------------------ */

/**
 * Documents that should win retrieval for a given intent.
 */
const INTENT_DOCUMENT_BIAS = {
  grading: ['kb_grading_scale'],
  probation: ['kb_probation_policy'],
  waiver: ['kb_merit_scholarship', 'kb_waiver_conditions', 'kb_waiver_categories'],
  fees: ['kb_tuition_fees', 'kb_payment_policy'],
  fydp: ['kb_fydp_policy'],
  curriculum: ['kb_bscse_degree_requirements', 'kb_course_equivalence', 'kb_internship_requirement'],
  exam: ['kb_exam_slots', 'kb_calendar_and_deadlines'],
  registration: ['kb_registration_policies', 'kb_calendar_and_deadlines'],
  attendance: ['kb_attendance_policy'],
  retake: ['kb_retake_policy', 'kb_grading_scale'],
  withdrawal: ['kb_withdraw_incomplete'],
  internship: ['kb_internship_requirement', 'kb_project_thesis_completion'],
  transport: ['kb_transport_service'],
  selfstudy: ['kb_self_study'],
  honors: ['kb_unsourced_topics'],
};

function intentBoostFor(docId, intent) {
  if (!intent) return 0;
  const preferred = INTENT_DOCUMENT_BIAS[intent] || [];
  const index = preferred.indexOf(docId);
  if (index === -1) return 0;
  return 0.9 - index * 0.2;
}

/** Cosine similarity between two token bags, used by the MMR diversifier. */
function cosineSimilarity(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) return 0;
  const a = new Map();
  for (const t of aTokens) a.set(t, (a.get(t) || 0) + 1);
  const b = new Map();
  for (const t of bTokens) b.set(t, (b.get(t) || 0) + 1);

  let dot = 0;
  for (const [token, count] of a) {
    const other = b.get(token);
    if (other) dot += count * other;
  }
  if (!dot) return 0;

  let magA = 0;
  for (const count of a.values()) magA += count * count;
  let magB = 0;
  for (const count of b.values()) magB += count * count;

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Maximum Marginal Relevance over clause candidates.
 *
 * The first pick is the best raw match. Every later pick trades relevance
 * against similarity to what has already been picked, so two nearly identical
 * clauses never fill the citation list.
 */
function selectDiverseClauses(candidates, topK) {
  const selected = [];
  const pool = [...candidates];

  while (selected.length < topK && pool.length) {
    let bestIndex = 0;
    let bestValue = -Infinity;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      let penalty = 0;

      for (const chosen of selected) {
        if (chosen.clause.id === candidate.clause.id) {
          penalty = 2;
          break;
        }
        if (chosen.clause.docId === candidate.clause.docId) {
          // Same document: only mildly penalised, a document often answers
          // a question in two separate clauses.
          penalty = Math.max(penalty, 0.25);
        }
        penalty += 0.45 * cosineSimilarity(chosen.clause.tokens, candidate.clause.tokens);
      }

      // Ranking uses the boosted score, not the raw term frequency, so the
      // clause that the question's intent points at actually gets picked.
      const value = candidate.effectiveScore - penalty;
      if (value > bestValue) {
        bestValue = value;
        bestIndex = i;
      }
    }

    selected.push(pool.splice(bestIndex, 1)[0]);
  }

  return selected;
}

function countTokens(tokens) {
  const tf = new Map();
  for (const token of tokens) tf.set(token, (tf.get(token) || 0) + 1);
  return tf;
}

/**
 * Rank verified UIU clauses for a question.
 *
 * @param {string} query  the student's question
 * @param {number} topK   how many clauses to return
 * @returns {Array} clauses with a relevance score, the quoted text and the
 *                  official source link
 */
export function retrieveRelevantDocuments(query = '', topK = 4) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return [];

  const queryTokens = tokenizeQuery(trimmed);
  if (!queryTokens.length) return [];

  const intents = detectIntent(trimmed);
  const topIntent = intents[0]?.intent || null;

  const { clauses, docs, docFreq, avgLength } = INDEX;
  const totalClauses = clauses.length;

  const candidates = [];
  for (const clause of clauses) {
    const score = bm25Score(clause, queryTokens, docFreq, totalClauses, avgLength);
    if (score > 0) candidates.push({ clause, score });
  }

  if (!candidates.length) return [];

  const maxScore = Math.max(...candidates.map((c) => c.score));

  // Apply the intent bias and normalise to a 0-1 confidence.
  for (const candidate of candidates) {
    const doc = docs.get(candidate.clause.docId);
    const fieldScore = bm25Score(
      { tf: countTokens(doc.fieldTokens), length: doc.fieldTokens.length },
      queryTokens,
      docFreq,
      totalClauses,
      avgLength
    );
    const boost = intentBoostFor(candidate.clause.docId, topIntent);

    candidate.fieldScore = fieldScore;
    candidate.intentBoost = boost;
    // Rank value, in raw BM25 units so the diversity penalty below keeps its
    // meaning. The intent boost and the document-level field match both
    // belong in it, otherwise a clause with a high term frequency but the
    // wrong subject outranks the clause the question is actually about.
    candidate.effectiveScore = candidate.score * (1 + boost) + fieldScore * 0.35;
    candidate.normalised = candidate.effectiveScore / maxScore;
  }

  candidates.sort((a, b) => b.normalised - a.normalised);

  // A question that names no known policy subject cannot be answered from
  // the knowledge base, however many stray word matches it produces.
  if (!topIntent) return [];

  // A clause that is only weakly related to the question is worse than no
  // citation at all, because the advisor would present it as an answer.
  const STRONG_MATCH = 0.18;
  const strong = candidates.filter((c) => c.normalised >= STRONG_MATCH);
  if (!strong.length) return [];

  // The best clause must also carry real weight. A single common word such
  // as "Dhaka" produces a low-scoring match that should not be cited.
  const bestRaw = Math.max(...strong.map((c) => c.score));
  const MIN_ABSOLUTE_SCORE = 1.2;
  if (bestRaw < MIN_ABSOLUTE_SCORE) return [];

  const selected = selectDiverseClauses(strong, topK);

  return selected.map((candidate) => toCitation(candidate, topIntent));
}

function toCitation(candidate, topIntent) {
  const doc = UIU_KNOWLEDGE_DOCUMENTS.find((d) => d.id === candidate.clause.docId);

  return {
    id: doc.id,
    clauseId: candidate.clause.id,
    title: doc.title,
    category: doc.category,
    source: doc.source,
    url: doc.url,
    verified: doc.verified,
    summary: doc.summary,
    snippet: candidate.clause.text.slice(0, 520),
    score: Number(candidate.normalised.toFixed(3)),
    intentBoost: candidate.intentBoost,
    intent: topIntent,
  };
}

/**
 * Search the knowledge base for the browser (title, summary and full text).
 */
export function searchKnowledgeBase(query = '', category = 'ALL') {
  const q = String(query || '').toLowerCase().trim();

  return UIU_KNOWLEDGE_DOCUMENTS.filter((doc) => {
    if (category !== 'ALL' && doc.category !== category) return false;
    if (!q) return true;
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q) ||
      doc.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });
}

/* ------------------------------------------------------------------ *
 * Prompt construction
 * ------------------------------------------------------------------ */

/**
 * Build the RAG-augmented prompt.
 *
 * The retrieved clauses are the only source of policy facts in the prompt.
 * Numeric questions about the student are answered by the deterministic
 * advisor tools, not by the language model.
 */
export function buildRagAugmentedPrompt({ query, studentContext = {}, retrievedDocs = [] }) {
  if (!retrievedDocs.length) {
    return `OFFICIAL UIU CLAUSES RETRIEVED FOR THIS QUESTION
====================

(none matched)

====================

STUDENT ACADEMIC RECORD
- CGPA: ${studentContext.cgpa ?? 'not imported'}
- Completed credits: ${studentContext.completedCredits ?? 0}
- Completed course codes: ${(studentContext.completedCourseCodes || []).join(', ') || 'none imported'}
- Selected specialization: ${studentContext.selectedMajor || 'General CSE'}

STUDENT QUESTION
"${query}"

ANSWERING RULES
1. No matching clause was found in the verified UIU knowledge base, so you have no official UIU rule to quote for this question.
2. Do NOT invent a rule, number, fee, deadline, credit load or office name. Do not guess from general university knowledge.
3. Still be an advisor: say in one short paragraph what the official UIU documents do and do not cover for this question, name the UIU office that decides it (Office of the Controller of Examinations, Department of Computer Science and Engineering, Office of Academic Affairs, or Financial Aid and Scholarship Office — whichever genuinely handles it), and tell the student exactly what to ask them or bring to them.
4. If the student's own record makes the question answerable, do that part using the academic record above and say which part you could not confirm.
5. No preamble, no filler, no emoji, no jokes, no exclamation marks.
6. Markdown only: bold, lists, tables. Never HTML.`;
  }

  const contextBlocks = retrievedDocs
    .map(
      (doc, i) => `[CLAUSE ${i + 1} - ${doc.title}]
Authority: ${doc.source}
Category: ${doc.category}
Last verified: ${doc.verified} | Source: ${doc.url}

${doc.snippet}`
    )
    .join('\n\n');

  return `OFFICIAL UIU CLAUSES RETRIEVED FOR THIS QUESTION
========================

${contextBlocks}

========================

STUDENT ACADEMIC RECORD
- CGPA: ${studentContext.cgpa ?? 'not imported'}
- Completed credits: ${studentContext.completedCredits ?? 0}
- Completed course codes: ${(studentContext.completedCourseCodes || []).join(', ') || 'none imported'}
- Selected specialization: ${studentContext.selectedMajor || 'General CSE'}

STUDENT QUESTION
"${query}"

ANSWERING RULES
1. You are the student's ACADEMIC ADVISOR, not a search engine and not a prerequisite tree. The student has a real problem and wants a course of action. Give them one.
2. Use only the retrieved clauses for policy facts. Never state a rule, number, fee, deadline or threshold that is not in them. If you cannot ground it, do not say it.
3. Name the source document when you state a rule, minimum, deadline or fee.
4. Check the student's academic record above before answering. If the question is about their own situation ("my CGPA is low", "what can I take", "how do I recover"), state their actual situation first, then the rule that applies to it, then what they should do next.
5. Lead with the ACTION. Open with what the student should do or understand, then support it with the policy. Do not open with a restatement of the question, and do not open with a preamble.
6. Be specific and concrete. Give the actual minimum, the actual credit count, the actual number of notices or attempts, the actual office, the actual sequence of steps — not "it depends on your situation" or "consult your advisor for details".
7. Never answer with a course prerequisite tree or a list of course codes unless the student asked which courses to take. If they did ask, name the specific courses and why.
8. If the clauses do not cover part of the question, answer the part they do cover, then name the office that decides the rest. Do not refuse the whole question because one part is uncovered.
9. Do not tell the student to "meet with an advisor" as the answer. You are their advisor. Give the guidance, and name an office only when a human decision is genuinely required.
10. No hype, no encouragement padding, no emoji, no jokes, no exclamation marks, no "Great question", no "Let's dive in", no "You're not alone in this", no summary of your own answer.
11. Markdown only: bold, lists, tables. Never HTML.`;
}
