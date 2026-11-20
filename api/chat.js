/**
 * Vercel Serverless Function: hosted-model Academic Advisor proxy.
 *
 * This runs entirely on the server. The proxy keeps the API key server-side,
 * tries each candidate model in turn until one answers, and never returns a
 * key, an auth header, the provider name or the selected model to the
 * browser — students never pick or see an engine.
 *
 * The free-model catalogue rotates often, so the cascade is not a fixed list.
 * Each request asks the upstream catalogue which models are currently
 * marked :free and tries them in a stable order, with a hardcoded fallback
 * list for the case where the catalogue call fails.
 */

const FALLBACK_FREE_MODELS = [
  'nvidia/nemotron-3.5-lightning:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3.5-flash-02-23:free',
  'deepseek/deepseek-v3.2:free',
  'mistralai/mistral-3b-2512:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.5-flash-lite:free',
];

/** Models that are known to answer reliably for long academic prompts. */
const PREFERRED_FREE_MODELS = [
  'google/gemini-2.5-flash-lite:free',
  'deepseek/deepseek-v3.2:free',
  'qwen/qwen3.5-flash-02-23:free',
  'nvidia/nemotron-3.5-lightning:free',
];

const CATALOGUE_TTL_MS = 30 * 60 * 1000;
let catalogueCache = { at: 0, models: null };

/**
 * Answer cache.
 *
 * A repeat question must not cost anything, so the cache lives here on the
 * server and is keyed by the question itself — not by the student. Two
 * different students asking "what is the FYDP credit gate?" hit the same
 * entry, and the second one costs nothing because no upstream call is made.
 *
 * The answer is reused as-is: the retrieved policy clauses and the academic
 * context are the same for everyone, so the reply does not depend on who
 * asked. Only the grounding documents are part of the key, because a change
 * in the statute set must not serve a stale answer.
 */
const ANSWER_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const ANSWER_CACHE_MAX_ENTRIES = 500;
const answerCache = new Map();

/**
 * A stable key for a question.
 *
 * The question is normalised so that casing, trailing punctuation and
 * repeated whitespace still match, which is what makes "How many credits do
 * I need for FYDP?" and "how many credits do i need for fydp" the same
 * request.
 */
function answerCacheKey(prompt, systemInstructions) {
  const norm = (text) =>
    String(text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  return `${norm(prompt)}::${norm(systemInstructions).slice(0, 400)}`;
}

function readCachedAnswer(key) {
  const entry = answerCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.at > ANSWER_CACHE_TTL_MS) {
    answerCache.delete(key);
    return null;
  }

  // Refresh recency so the least-recently-used entry is evicted first.
  answerCache.delete(key);
  answerCache.set(key, entry);
  return entry;
}

function writeCachedAnswer(key, value) {
  if (answerCache.size >= ANSWER_CACHE_MAX_ENTRIES) {
    const oldestKey = answerCache.keys().next().value;
    if (oldestKey) answerCache.delete(oldestKey);
  }
  answerCache.set(key, { at: Date.now(), ...value });
}

/**
 * Fetch the live list of :free models from the OpenRouter catalogue.
 * Cached for 30 minutes so a chat burst does not hammer the catalogue.
 */
async function getFreeModels(apiKey) {
  const now = Date.now();
  if (catalogueCache.models && now - catalogueCache.at < CATALOGUE_TTL_MS) {
    return catalogueCache.models;
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}`, 'User-Agent': 'EZ_UIU' },
    });
    if (!res.ok) throw new Error(`catalogue HTTP ${res.status}`);
    const json = await res.json();

    const free = (json.data || [])
      .filter((m) => String(m.id).endsWith(':free'))
      .map((m) => m.id);

    if (free.length) {
      const ordered = [
        ...PREFERRED_FREE_MODELS.filter((id) => free.includes(id)),
        ...free.filter((id) => !PREFERRED_FREE_MODELS.includes(id)).sort(),
      ];
      catalogueCache = { at: now, models: ordered };
      return ordered;
    }
  } catch {
    /* fall through to the hardcoded list */
  }

  catalogueCache = { at: now, models: FALLBACK_FREE_MODELS };
  return FALLBACK_FREE_MODELS;
}

/**
 * Remove anything that looks like a credential before it leaves the server.
 */
function sanitize(text) {
  return String(text || '')
    .replace(/Bearer\s+[a-zA-Z0-9_\-.]+/gi, 'Bearer [REDACTED]')
    .replace(/sk-or-v1-[a-zA-Z0-9_\-]+/gi, '[REDACTED]')
    .replace(/sk-[a-zA-Z0-9_\-]{16,}/g, '[REDACTED]');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const effectiveKey = (process.env.OPENROUTER_API_KEY || '').trim();

  // Health / environment check endpoint.
  if (req.method === 'GET') {
    // The engine and model are picked automatically, so this endpoint only
    // reports readiness. It deliberately does not disclose the provider or
    // the model catalogue to the browser.
    let models = [];
    if (effectiveKey) {
      models = await getFreeModels(effectiveKey);
    }
    return res.status(200).json({
      status: 'ok',
      hasHostedKey: Boolean(effectiveKey),
      freeModelCount: models.length,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    model = 'auto-free',
    prompt = '',
    systemInstructions = '',
    conversationHistory = [],
    augmentedPrompt = '',
  } = req.body || {};

  const rawQuestion = (prompt || '').trim();
  const groundedPrompt = (augmentedPrompt || '').trim();

  if (!rawQuestion && !groundedPrompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  /**
   * The user message the model actually receives.
   *
   * This must be the GROUNDED prompt, not the bare question. The grounded
   * prompt carries the retrieved UIU policy clauses and the student's own
   * academic record; the bare question carries neither. Sending only the
   * question makes the model answer from general knowledge instead of the
   * official UIU policy, which is how an ungrounded advisor starts inventing
   * credit loads, offices and deadlines that UIU never published.
   *
   * The raw question is appended so the model always knows which question it
   * is answering, even if the grounded prompt was built from a follow-up.
   */
  const cleanPrompt = groundedPrompt
    ? `${groundedPrompt.slice(0, 4000)}\n\n---\n\nQUESTION TO ANSWER: ${rawQuestion || groundedPrompt}`.slice(0, 4500)
    : rawQuestion.slice(0, 4500);

  if (!effectiveKey) {
    return res.status(500).json({
      error:
        'Vercel OPENROUTER_API_KEY environment variable is not configured yet in Project Settings.',
    });
  }

  const startTime = Date.now();
  const isAutoFree = !model || model === 'auto-free' || model === 'openrouter/auto';

  /**
   * A repeat question costs nothing. The cache is checked before any
   * upstream call, so a cached answer never reaches the paid endpoint.
   */
  const cacheKey = answerCacheKey(cleanPrompt, systemInstructions);
  const cachedAnswer = readCachedAnswer(cacheKey);
  if (cachedAnswer) {
    return res.status(200).json({
      text: cachedAnswer.text,
      usage: cachedAnswer.usage || {},
      latencyMs: Date.now() - startTime,
      isServerless: true,
      isCached: true,
    });
  }

  let modelsToAttempt;
  if (isAutoFree) {
    modelsToAttempt = await getFreeModels(effectiveKey);
  } else {
    modelsToAttempt = [model];
  }

  const messages = [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text:
            systemInstructions ||
            'You are the official UIU AI Academic Advisor. Answer only from the clauses supplied in the user message.',
          cache_control: { type: 'ephemeral' },
        },
      ],
    },
    ...conversationHistory.slice(-4).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    {
      role: 'user',
      content: cleanPrompt,
    },
  ];

  let lastError = null;

  for (const candidateModel of modelsToAttempt) {
    try {
      const payload = {
        model: candidateModel,
        messages,
        temperature: 0.2,
        max_tokens: 1400,
      };

      const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveKey}`,
          'HTTP-Referer': 'https://ez-uiu.vercel.app',
          'X-Title': 'EZ_UIU',
        },
        body: JSON.stringify(payload),
      });

      if (!apiRes.ok) {
        const errJson = await apiRes.json().catch(() => ({}));
        lastError = errJson?.error?.message || `HTTP ${apiRes.status}`;
        continue;
      }

      const data = await apiRes.json();
      const reply = data?.choices?.[0]?.message?.content;
      if (!reply) {
        lastError = 'Empty response from model';
        continue;
      }

      const cachedTokens =
        data.usage?.prompt_tokens_details?.cached_tokens ||
        data.usage?.cache_read_input_tokens ||
        0;

      // Cache the answer so this exact question is free from now on.
      writeCachedAnswer(cacheKey, {
        text: reply,
        usage: {
          promptTokens: data?.usage?.prompt_tokens || 0,
          completionTokens: data?.usage?.completion_tokens || 0,
          cachedTokens,
        },
      });

      return res.status(200).json({
        text: reply,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          cachedTokens,
        },
        latencyMs: Date.now() - startTime,
        isServerless: true,
        isCached: false,
      });
    } catch (err) {
      lastError = err.message || 'Network error';
    }
  }
  return res.status(503).json({
    error: `All AI models are busy right now (${sanitize(lastError) || 'Service unavailable'}). Try again in a few seconds.`,
  });
}
