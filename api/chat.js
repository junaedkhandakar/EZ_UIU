/**
 * Vercel Serverless Function: OpenRouter AI Academic Advisor Proxy
 *
 * Implements resilient multi-model failover across every free AI endpoint
 * (DeepSeek R1 -> Gemini 2.0 Flash -> Llama 3.3 70B -> Qwen 2.5 -> Mistral).
 */

const FREE_MODELS_CASCADE = [
  'deepseek/deepseek-r1:free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
];

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

  // Health / Environment check endpoint
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      runtime: 'vercel-serverless',
      provider: 'openrouter',
      hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
      freeModelsCascade: FREE_MODELS_CASCADE,
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

  const effectiveKey = (process.env.OPENROUTER_API_KEY || '').trim();
  if (!effectiveKey) {
    return res.status(500).json({
      error: 'Vercel OPENROUTER_API_KEY environment variable is not configured yet in Project Settings.',
    });
  }

  const startTime = Date.now();
  const isAutoFree = !model || model === 'auto-free' || model === 'openrouter/auto';
  const modelsToAttempt = isAutoFree ? FREE_MODELS_CASCADE : [model];

  const messages = [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text: systemInstructions || 'You are the official UIU AI Academic Advisor.',
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

  // Try OpenRouter models with cascade failover
  for (const candidateModel of modelsToAttempt) {
    try {
      const payload = {
        model: candidateModel,
        messages,
        temperature: 0.35,
        max_tokens: 850,
      };

      if (isAutoFree) {
        payload.models = FREE_MODELS_CASCADE;
      }

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

      const answeredModel = data?.model || candidateModel;

      return res.status(200).json({
        text: reply,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          cachedTokens,
        },
        latencyMs: Date.now() - startTime,
        isServerless: true,
        model: answeredModel,
        autoSwitched: isAutoFree,
      });
    } catch (err) {
      lastError = err.message || 'Network error';
    }
  }

  // Sanitize any potential bearer tokens or keys from error strings before returning
  const sanitizedError = String(lastError || 'Service unavailable')
    .replace(/Bearer\s+[a-zA-Z0-9_\-.]+/gi, 'Bearer [REDACTED]')
    .replace(/sk-or-v1-[a-zA-Z0-9_\-]+/gi, '[REDACTED]');

  return res.status(503).json({
    error: `All free AI models are busy right now (${sanitizedError}). Try again in a few seconds.`,
  });
}
