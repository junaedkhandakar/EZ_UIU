/**
 * EZ_UIU - Client-side RAG (Retrieval-Augmented Generation) Engine
 * Performs intelligent retrieval over the verified UIU knowledge base,
 * scores relevance, injects cited context into AI prompts, and provides source inspector data.
 */

import { UIU_KNOWLEDGE_DOCUMENTS } from '../data/uiuKnowledgeBase';

const UIU_SYNONYMS = {
  thesis: ['fydp', 'capstone', 'project', 'cse 4000a', 'cse 4000b'],
  fyp: ['fydp', 'cse 4000a', 'cse 4000b', 'thesis'],
  waiver: ['scholarship', 'merit', 'discount', 'financial aid'],
  scholarship: ['waiver', 'merit', 'discount'],
  retake: ['repeat', 'replace', 'replacement', 'improvement', 'f grade'],
  repeat: ['retake', 'replace', 'replacement'],
  fail: ['f grade', 'probation', 'dismissal', 'cgpa'],
  failing: ['probation', 'dismissal', 'f grade'],
  probation: ['dismissal', 'low cgpa', 'cgpa 2.00', 'warning'],
  dismissal: ['probation', 'cgpa', '3 notices'],
  fee: ['tuition', 'cost', 'installment', 'per credit', 'payment'],
  tuition: ['fee', 'installment', 'per credit', 'billing'],
  cost: ['tuition', 'fee', 'installment'],
  installment: ['payment schedule', 'due date', '40/30/30'],
  honors: ['summa cum laude', 'magna cum laude', 'cum laude', 'convocation'],
  convocation: ['honors', 'summa', 'magna', 'cum laude'],
  attendance: ['absent', '80% rule', 'debarred'],
  absent: ['attendance', '80% rule'],
  exam: ['final exam', 'slot', 't1', 't2', 't3', 'schedule'],
  slot: ['exam slot', 't1', 't2', 't3', 'timing'],
  track: ['major', 'specialization', 'electives'],
  major: ['track', 'specialization', 'software engineering', 'data science'],
  specialization: ['track', 'major', 'electives'],
  ucam: ['portal', 'advising', 'registration', 'billing'],
  drop: ['withdraw', 'w grade', 'incomplete'],
  withdraw: ['w grade', 'drop', 'deadline'],
  credits: ['141 credits', '138 credits', 'curriculum', 'degree requirements'],
};

/**
 * Tokenize and normalize query string
 */
export function tokenizeQuery(text = '') {
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s%.-]/g, ' ')
    .trim();
  const rawTokens = clean.split(/\s+/).filter((t) => t.length >= 2);

  // Expand with UIU domain synonyms
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
 * Score a document's relevance against query tokens
 */
function scoreDocument(doc, queryTokens, rawQuery) {
  let score = 0;
  const docTitleLower = doc.title.toLowerCase();
  const docSummaryLower = doc.summary.toLowerCase();
  const docContentLower = doc.content.toLowerCase();
  const docKeywords = doc.keywords.map((k) => k.toLowerCase());
  const rawQueryLower = rawQuery.toLowerCase();

  // 1. Exact phrase match in title or summary (huge boost)
  if (docTitleLower.includes(rawQueryLower)) score += 50;
  if (docSummaryLower.includes(rawQueryLower)) score += 30;

  // 2. Token matches across fields
  queryTokens.forEach((token) => {
    // Title match: high weight
    if (docTitleLower.includes(token)) score += 15;
    // Keywords match: strong signal
    if (docKeywords.some((k) => k.includes(token))) score += 12;
    // Summary match
    if (docSummaryLower.includes(token)) score += 8;
    // Content match frequency
    const contentMatches = (docContentLower.match(new RegExp(token, 'g')) || []).length;
    score += Math.min(10, contentMatches * 2);
  });

  return score;
}

/**
 * Extract the most relevant excerpt snippet from a document based on query
 */
function extractSnippet(content, queryTokens, maxLength = 220) {
  const sentences = content.split('\n').filter((s) => s.trim().length > 0);
  let bestSentence = sentences[0] || '';
  let maxScore = -1;

  sentences.forEach((sentence) => {
    const sLower = sentence.toLowerCase();
    let sScore = 0;
    queryTokens.forEach((tok) => {
      if (sLower.includes(tok)) sScore += 5;
    });
    if (sScore > maxScore) {
      maxScore = sScore;
      bestSentence = sentence;
    }
  });

  const cleanSnippet = bestSentence.replace(/^[•\-\d.\s]+/, '').trim();
  if (cleanSnippet.length > maxLength) {
    return cleanSnippet.slice(0, maxLength) + '…';
  }
  return cleanSnippet;
}

/**
 * Core RAG Retrieval function: finds the top-K official UIU documents
 */
export function retrieveRelevantDocuments(query = '', topK = 3) {
  if (!query || !query.trim()) return [];

  const queryTokens = tokenizeQuery(query);
  const scored = UIU_KNOWLEDGE_DOCUMENTS.map((doc) => {
    const score = scoreDocument(doc, queryTokens, query);
    return {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      source: doc.source,
      lastVerified: doc.lastVerified,
      rawScore: score,
      snippet: extractSnippet(doc.content, queryTokens),
      content: doc.content,
    };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.rawScore - a.rawScore);

  // Filter out completely irrelevant docs
  const relevant = scored.filter((d) => d.rawScore > 8).slice(0, topK);

  // Normalize scores to percentage (30% to 98%)
  const maxRaw = relevant[0]?.rawScore || 1;
  return relevant.map((doc, idx) => ({
    ...doc,
    confidencePct: Math.min(99, Math.max(45, Math.round((doc.rawScore / maxRaw) * 95) - idx * 5)),
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
Category: ${doc.category}
Authority: ${doc.source}
Verified Content:
${doc.content}
`
    )
    .join('\n------------------------\n');

  return `
Official UIU Knowledge Retrieved for this Question:
------------------------
${contextDocsBlock}
------------------------

Student Current Record:
- CGPA: ${studentContext.cgpa || 'N/A'}
- Completed Credits: ${studentContext.completedCredits || 0} cr
- Completed Courses: ${(studentContext.completedCourseCodes || []).join(', ') || 'None'}
- Selected Major: ${studentContext.selectedMajor || 'General CSE'}

Student Question:
"${query}"

Instructions for Response:
1. Answer the student's question accurately using the retrieved official UIU documents above.
2. When citing specific facts (such as fee amounts, probation notices, 80% attendance, or FYDP 80 credits), include brief source citations like [Source: ${retrievedDocs[0]?.title}].
3. Format with clean GitHub-flavored Markdown bullet points and bold highlights.
4. Keep the answer direct, warm, and free of unnecessary fluff.
`;
}
