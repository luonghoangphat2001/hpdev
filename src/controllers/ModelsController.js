'use strict';

const OpenAI = require('openai');
const { memoryCache, CacheConfig } = require('@cache');

/**
 * Returns available model IDs for a given AI provider.
 * Fetches live from each provider's API with memory caching so the UI remains fast.
 */
class ModelsController {
  /** @type {import('../models/ConfigRepository')} */
  #configRepo;

  /** @param {import('../models/ConfigRepository')} configRepo */
  constructor(configRepo) {
    this.#configRepo = configRepo;
    this.list = this.list.bind(this);
  }

  async list(req, res) {
    const { provider } = req.params;
    const cacheKey = CacheConfig.KEYS.models(provider);
    try {
      const models = await memoryCache.wrap(cacheKey, CacheConfig.TTL.MODELS, async () => {
        let result;
        switch (provider) {
          case 'gemini':  result = await this.#geminiModels();  break;
          case 'claude':  result = await this.#claudeModels();  break;
          case 'chatgpt': result = await this.#chatgptModels(); break;
          case 'deepseek': result = await this.#openAICompatibleModels('DEEPSEEK_API_KEY', 'DEEPSEEK_BASE_URL', /^(deepseek|deepseek-ai)/i); break;
          case 'kimi': result = await this.#openAICompatibleModels('KIMI_API_KEY', 'KIMI_BASE_URL', /kimi/i); break;
          case 'vllm': result = await this.#openAICompatibleModels('VLLM_API_KEY', 'VLLM_BASE_URL'); break;
          case 'ollama': result = await this.#openAICompatibleModels('OLLAMA_API_KEY', 'OLLAMA_BASE_URL'); break;
          case 'nvidia': result = await this.#openAICompatibleModels('NVIDIA_API_KEY', 'NVIDIA_BASE_URL'); break;
          case 'cloudflare': result = await this.#cloudflareModels(); break;
          default: return null;
        }

        if (Array.isArray(result) && result.length === 0) {
          throw new Error(`${provider} returned no live models`);
        }
        return result;
      });

      if (models === null) {
        return res.status(400).json({ error: 'Unknown provider', models: [] });
      }
      // Clear disabled flag on successful fetch
      this.#configRepo.set(`${provider}_disabled`, false);
      const disabled = false;
      res.json({ models, disabled, unavailable: false, selection_disabled: false });

    } catch (err) {
      console.warn(`[ModelsController] ${provider} list failed:`, err.message);
      res.json({
        models: [],
        error: err.message,
        fallback: false,
        unavailable: true,
        disabled: true,
        selection_disabled: true,
      });
    }
  }

  // ── Gemini ────────────────────────────────────────────────────────────────
  async #geminiModels() {
    const key = process.env.GEMINI_KEY;
    if (!key) throw new Error('GEMINI_KEY not configured in environment');
    const baseUrl = process.env.GEMINI_BASE_URL
      ? process.env.GEMINI_BASE_URL
      : process.env.GEMINI_API_BASE_URL;
    if (!baseUrl) throw new Error('GEMINI_BASE_URL not configured in environment');

    // The JS SDK does not expose listModels() — use the REST endpoint directly.
    const url = `${baseUrl.replace(/\/$/, '')}/v1beta/models?pageSize=100&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gemini API ${res.status}`);
    const data = await res.json();

    return (data.models || [])
      .filter((m) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map((m) => ({ id: m.name, label: m.displayName ? m.displayName : m.name }))
      .sort((a, b) => b.id.localeCompare(a.id)); // newest first
  }

  // ── Claude ────────────────────────────────────────────────────────────────
  async #claudeModels() {
    const apiKey = process.env.CLAUDE_KEY;
    if (!apiKey) throw new Error('CLAUDE_KEY not configured in environment');
    const base = process.env.CLAUDE_BASE_URL
      ? process.env.CLAUDE_BASE_URL
      : process.env.CLAUDE_API_BASE_URL;
    if (!base) throw new Error('CLAUDE_BASE_URL not configured in environment');

    const res = await fetch(`${base.replace(/\/$/, '')}/v1/models?limit=100`, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}`);
    const data = await res.json();

    return (data.data || [])
      .map((m) => ({ id: m.id, label: m.display_name ? m.display_name : m.id }))
      .sort((a, b) => b.id.localeCompare(a.id)); // newest first
  }

  // ── ChatGPT / OpenAI ──────────────────────────────────────────────────────
  async #chatgptModels() {
    const apiKey = process.env.OPENAI_KEY;
    if (!apiKey) throw new Error('OPENAI_KEY not configured in environment');
    const baseUrl = process.env.OPENAI_BASE_URL;
    if (!baseUrl) throw new Error('OPENAI_BASE_URL not configured in environment');

    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    });
    const res = await client.models.list();

    return res.data
      .filter((m) => /^(gpt-|o1|o3)/.test(m.id))
      .map((m) => ({ id: m.id, label: m.id }))
      .sort((a, b) => b.id.localeCompare(a.id)); // newest first
  }

  async #openAICompatibleModels(keyName, baseUrlName, filter = null) {
    const apiKey = process.env[keyName];
    if (!apiKey) throw new Error(`${keyName} not configured in environment`);
    const baseUrl = process.env[baseUrlName];
    if (!baseUrl) throw new Error(`${baseUrlName} not configured in environment`);
    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    const response = await client.models.list();
    return response.data
      .map((model) => model.id)
      .filter((id) => !filter || filter.test(id))
      .map((id) => ({ id, label: id }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  async #cloudflareModels() {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!token) throw new Error('CLOUDFLARE_API_TOKEN not configured in environment');
    const baseUrl = process.env.CLOUDFLARE_BASE_URL;
    if (!baseUrl) throw new Error('CLOUDFLARE_BASE_URL not configured in environment');
    const url = `${baseUrl.replace(/\/$/, '')}/ai/models/search`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Cloudflare model API ${response.status}`);
    const body = await response.json();
    const rows = Array.isArray(body.result) ? body.result : [];
    return rows
      .map((model) => {
        if (model.id) return model.id;
        if (model.name) return model.name;
        if (model.model) return model.model;
        return null;
      })
      .filter(Boolean)
      .map((id) => ({ id, label: id }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

}

module.exports = ModelsController;
