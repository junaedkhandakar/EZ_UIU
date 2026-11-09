/**
 * EZ_UIU - Client-Side Prompt & Response Cache
 * Implements in-memory + localStorage LRU caching for instant 0ms responses on repeated queries.
 */

const STORAGE_CACHE_KEY = 'ez_ai_prompt_cache_v1';
const MAX_CACHE_ENTRIES = 50;

class PromptCache {
  constructor() {
    this.memoryCache = new Map();
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([k, v]) => {
          this.memoryCache.set(k, v);
        });
      }
    } catch {}
  }

  saveToStorage() {
    try {
      const obj = Object.fromEntries(this.memoryCache);
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(obj));
    } catch {}
  }

  generateKey({ prompt, model, provider, cgpa, completedCredits, major }) {
    const cleanPrompt = (prompt || '').trim().toLowerCase();
    return `${provider || 'openrouter'}::${model || 'default'}::${cgpa || 0}::${completedCredits || 0}::${major || ''}::${cleanPrompt}`;
  }

  get(params) {
    const key = this.generateKey(params);
    if (!this.memoryCache.has(key)) return null;

    const entry = this.memoryCache.get(key);
    // Expire cache after 48 hours
    if (Date.now() - entry.timestamp > 48 * 60 * 60 * 1000) {
      this.memoryCache.delete(key);
      this.saveToStorage();
      return null;
    }

    // Move to end (LRU)
    this.memoryCache.delete(key);
    this.memoryCache.set(key, entry);
    return {
      ...entry.data,
      isClientCached: true,
      cacheLatencyMs: 0,
    };
  }

  set(params, data) {
    const key = this.generateKey(params);
    if (this.memoryCache.size >= MAX_CACHE_ENTRIES) {
      // Evict oldest entry
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, {
      timestamp: Date.now(),
      data,
    });
    this.saveToStorage();
  }

  clear() {
    this.memoryCache.clear();
    try {
      localStorage.removeItem(STORAGE_CACHE_KEY);
    } catch {}
  }
}

export const promptCache = new PromptCache();
