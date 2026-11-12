/**
 * EZ_UIU - Client-side RAG (Retrieval-Augmented Generation) Engine
 * Performs high-precision semantic retrieval over the verified UIU knowledge base,
 * computes multi-field relevance scores, injects authoritative citations, and protects against hallucinations.
 */

import { UIU_KNOWLEDGE_DOCUMENTS } from '../data/uiuKnowledgeBase';

/**
 * Domain-specific UIU synonyms and ontology mapping
 */
const UIU_SYNONYMS = {
  thesis: ['fydp', 'capstone', 'project', 'cse 4000a', 'cse 4000b', '80 credits', 'supervisor'],
  fyp: ['fydp', 'cse 4000a', 'cse 4000b', 'thesis', 'capstone'],
  fydp: ['thesis', 'capstone', 'cse 4000a', 'cse 4000b', '80 credits', 'project defense'],
  waiver: ['scholarship', 'merit', 'discount', 'financial aid', '100% waiver', '50% waiver', '25% waiver'],
  scholarship: ['waiver', 'merit', 'discount', 'top 2%', 'next 4%', 'gpa 3.50'],
  retake: ['repeat', 'grade replacement', 'improvement', 'f grade', 'd grade', '50% discount'],
  repeat: ['retake', 'grade replacement', '50% waiver'],
  fail: ['f grade', 'probation', 'dismissal', 'cgpa', 'failing grade'],
  failing: ['probation', 'dismissal', 'f grade', 'warning'],
  probation: ['dismissal', 'low cgpa', 'cgpa 2.00', 'warning', '3 notices', 'credit cap'],
  dismissal: ['probation', 'cgpa', '3 notices', 'academic dismissal', 'expelled'],
  fee: ['tuition', 'cost', 'installment', 'per credit', 'payment', '6500', '5525'],
  tuition: ['fee', 'installment', 'per credit', 'billing', '6500', '5525', 'batch 241'],
  cost: ['tuition', 'fee', 'installment', 'degree cost'],
  installment: ['payment schedule', 'due date', '40/30/30', '1st installment', '2nd installment', '3rd installment'],
  honors: ['summa cum laude', 'magna cum laude', 'cum laude', 'convocation', '3.90', '3.80', '3.75'],
  convocation: ['honors', 'summa', 'magna', 'cum laude', 'graduation distinction'],
  attendance: ['absent', '80% rule', 'debarred', 'mandatory attendance', 'medical certificate'],
  absent: ['attendance', '80% rule', 'medical certificate', 'leave'],
  exam: ['final exam', 'slot', 't1', 't2', 't3', 'schedule', 'midterm', 'clash'],
  slot: ['exam slot', 't1', 't2', 't3', 'timing', '9:00 am', '11:30 am', '2:00 pm'],
  track: ['major', 'specialization', 'electives', 'software engineering', 'data science', 'cybersecurity'],
  major: ['track', 'specialization', 'software engineering', 'ai data science', 'cybersecurity', '4 electives'],
  specialization: ['track', 'major', 'electives', 'concentration'],
  ucam: ['portal', 'advising', 'registration', 'billing', 'cloud ucam'],
  drop: ['withdraw', 'w grade', 'incomplete', 'course drop', 'refund deadline', '100% refund'],
  withdraw: ['w grade', 'drop', 'deadline', 'withdrawn'],
  credits: ['141 credits', '138 credits', '137 credits', 'curriculum', 'degree requirements', 'total credits'],
  batch: ['241', '233', 'intake', 'summer 2026', 'fee rate', 'per credit'],
  shuttle: ['bus', 'transport', 'notun bazar', 'kuril', 'biswa road', 'schedule', 'shift'],
  bus: ['shuttle', 'transport', 'route', 'notun bazar', 'kuril'],
};

/**
 * Tokenize and normalize query string with domain expansion
 */
export function tokenizeQuery(text = '') {
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s%.-]/g, ' ')
    .trim();
  const rawTokens = clean.split(/\s+/).filter((t) => t.length >= 2);

  const expanded = new Set(rawTokens);
  rawTokens.forEach((tok) => {
    if (UIU_SYNONYMS[tok]) {
      UIU_SYNONYMS[tok].forEach((syn) => {
        syn.split(/\s+/).forEach((s) => expanded.add(s));
      });
    }
  });

  return Array.from(expanded);
}

/**
 * Multi-factor relevance scoring for UIU knowledge documents
 */
function scoreDocument(doc, queryTokens, rawQuery) {
  let score = 0;
  const docTitleLower = doc.title.toLowerCase();
  const docSummaryLower = doc.summary.toLowerCase();
  const docContentLower = doc.content.toLowerCase();
  const docCategoryLower = (doc.category || '').toLowerCase();
  const docKeywords = (doc.keywords || []).map((k) => k.toLowerCase());
  const rawQueryLower = rawQuery.toLowerCase().trim();

  // 1. Exact phrase matches (strongest signal)
  if (docTitleLower.includes(rawQueryLower)) score += 60;
  if (docSummaryLower.includes(rawQueryLower)) score += 35;
  if (docContentLower.includes(rawQueryLower)) score += 25;

  // 2. Keyword exact matches
  if (docKeywords.some((k) => k === rawQueryLower || rawQueryLower.includes(k))) {
    score += 40;
  }

  // 3. Category relevancy
  queryTokens.forEach((token) => {
    if (docCategoryLower.includes(token)) score += 15;
  });

  // 4. Token matches across fields
  queryTokens.forEach((token) => {
    // Title match
    if (docTitleLower.includes(token)) score += 20;

    // Keywords match
    if (docKeywords.some((k) => k.includes(token))) score += 15;

    // Summary match
    if (docSummaryLower.includes(token)) score += 10;

    // Content match frequency (capped to prevent long-doc bias)
    const count = (docContentLower.match(new RegExp(`\\b${token}\\b`, 'g')) || []).length;
    score += Math.min(15, count * 3);
  });

  return score;
}

/**
 * Extracts the most informative, deadline- or number-heavy snippet from a document
 */
function extractSnippet(content, queryTokens, maxLength = 240) {
  const paragraphs = content
    .split(/\n\s*\n|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (!paragraphs.length) return content.slice(0, maxLength);

  let bestParagraph = paragraphs[0];
  let maxScore = -1;

  paragraphs.forEach((p) => {
    const pLower = p.toLowerCase();
    let pScore = 0;

    // Match query tokens
    queryTokens.forEach((tok) => {
      if (pLower.includes(tok)) pScore += 10;
    });

    // Reward paragraphs with actionable policy details (numbers, grades, rules)
    if (/\b\d+(\.\d+)?(%|cr|credits|tk|gpa|cgpa)\b/i.test(p)) pScore += 12;
    if (/\b(must|require|rule|deadline|statute|eligib)\b/i.test(p)) pScore += 8;

    if (pScore > maxScore) {
      maxScore = pScore;
      bestParagraph = p;
    }
  });

  const clean = bestParagraph.replace(/^[•\-\d.\s*#]+/, '').trim();
  if (clean.length > maxLength) {
    return clean.slice(0, maxLength) + '…';
  }
  return clean;
}

/**
 * Core RAG Retrieval: Returns top-K most authoritative UIU documents with confidence scores
 */
export function retrieveRelevantDocuments(query = '', topK = 3) {
  if (!query || !query.trim()) return [];

  const queryTokens = tokenizeQuery(query);
  const scored = UIU_KNOWLEDGE_DOCUMENTS.map((doc) => {
    const rawScore = scoreDocument(doc, queryTokens, query);
    return {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      source: doc.source,
      lastVerified: doc.lastVerified,
      rawScore,
      snippet: extractSnippet(doc.content, queryTokens),
      content: doc.content,
    };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.rawScore - a.rawScore);

  // Filter out irrelevant documents
  const relevant = scored.filter((d) => d.rawScore >= 12).slice(0, topK);
  if (!relevant.length) return [];

  // Normalize scores to clean confidence percentages (50% to 99%)
  const maxRaw = Math.max(1, relevant[0].rawScore);
  return relevant.map((doc, idx) => ({
    ...doc,
    confidencePct: Math.min(
      99,
      Math.max(50, Math.round((doc.rawScore / maxRaw) * 96) - idx * 4)
    ),
  }));
}

/**
 * Build RAG Augmented Prompt for AI Models with explicit citation instructions
 */
export function buildRagAugmentedPrompt({ query, studentContext = {}, retrievedDocs = [] }) {
  if (!retrievedDocs.length) {
    return query;
  }

  const contextDocsBlock = retrievedDocs
    .map(
      (doc, i) => `
[SOURCE ${i + 1}: ${doc.title}]
Authority / Statute: ${doc.source} (${doc.category})
Verified Clauses:
${doc.content}
`
    )
    .join('\n------------------------\n');

  return `
Official UIU Regulations & Verified Documents:
------------------------
${contextDocsBlock}
------------------------

Student Academic Record:
- Current CGPA: ${studentContext.cgpa || '0.00'}
- Completed Credits: ${studentContext.completedCredits || 0} cr
- Completed Course Codes: ${(studentContext.completedCourseCodes || []).join(', ') || 'None (Freshman Intake)'}
- Selected Specialization: ${studentContext.selectedMajor || 'General CSE'}

Student Question:
"${query}"

Instructions:
1. Answer strictly using official UIU regulations from the verified sources above.
2. Cite the specific policy or document title when mentioning rules, minimums, or fee rates (e.g. [Source: ${retrievedDocs[0]?.title}]).
3. If the student asks about personal eligibility (e.g. retakes, FYDP, scholarships, probation), check their academic record against the verified clauses.
4. Format using clean GitHub-flavored Markdown bullets, bold highlights, and readable tables where helpful.
`;
}
