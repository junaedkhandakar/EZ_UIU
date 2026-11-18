/**
 * Vercel Serverless Function: OpenRouter AI Academic Advisor Proxy
 *
 * The proxy keeps the API key on the server, tries each candidate model in
 * turn until one answers, and never returns a key or an auth header to the
 * browser.
 *
 * The free-model catalogue rotates often, so the cascade is not a fixed list.
 * Each request asks OpenRouter which models are currently marked :free and
 * tries them in a stable order, with a hardcoded fallback list for the case
 * where the catalogue call fails.
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
    let models = FALLBACK_FREE_MODELS;
    if (effectiveKey) {
      models = await getFreeModels(effectiveKey);
    }
    return res.status(200).json({
      status: 'ok',
      runtime: 'vercel-serverless',
      provider: 'openrouter',
      hasOpenRouterKey: Boolean(effectiveKey),
      freeModelCount: models.length,
      freeModels: models.slice(0, 20),
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

  const cleanPrompt = (prompt || augmentedPrompt || '').trim().slice(0, 4500);
  if (!cleanPrompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!effectiveKey) {
    return res.status(500).json({
      error:
        'Vercel OPENROUTER_API_KEY environment variable is not configured yet in Project Settings.',
    });
  }

  const startTime = Date.now();
  const isAutoFree = !model || model === 'auto-free' || model === 'openrouter/auto';

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

      return res.status(200).json({
        text: reply,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          cachedTokens,
        },
        latencyMs: Date.now() - startTime,
        isServerless: true,
        model: data?.model || candidateModel,
        autoSwitched: isAutoFree,
      });
    } catch (err) {
      lastError = err.message || 'Network error';
    }
  }

  return res.status(503).json({
    error: `All AI models are busy right now (${sanitize(lastError) || 'Service unavailable'}). Try again in a few seconds.`,
  });
}
