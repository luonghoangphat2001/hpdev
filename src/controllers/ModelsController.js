'use strict';

const OpenAI = require('openai');

/**
 * Returns available model IDs for a given AI provider.
 * Fetches live from each provider's API so the UI always shows current models.
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
    try {
      let models;
      switch (provider) {
        case 'gemini':  models = await this.#geminiModels();  break;
        case 'claude':  models = await this.#claudeModels();  break;
        case 'chatgpt': models = await this.#chatgptModels(); break;
        default: return res.status(400).json({ error: 'Unknown provider', models: [] });
      }
      res.json({ models });
    } catch (err) {
      // Return a fallback list so the UI stays functional even if the API is unreachable
      console.warn(`[ModelsController] ${provider} list failed:`, err.message);
      res.json({ models: [], error: err.message });
    }
  }

  // ── Gemini ────────────────────────────────────────────────────────────────
  async #geminiModels() {
    const key = process.env.GEMINI_KEY;
    if (!key) return [];

    // The JS SDK does not expose listModels() — use the REST endpoint directly.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=${encodeURIComponent(key)}`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`Gemini API ${res.status}`);
    const data = await res.json();

    return (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => ({ id: m.name, label: m.displayName || m.name }))
      .sort((a, b) => b.id.localeCompare(a.id)); // newest first
  }

  // ── Claude ────────────────────────────────────────────────────────────────
  async #claudeModels() {
    const apiKey = process.env.CLAUDE_KEY;
    if (!apiKey) return [];

    const base = (this.#configRepo.get('claude_base_url') || process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
    const res  = await fetch(`${base}/v1/models?limit=100`, {
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}`);
    const data = await res.json();

    return (data.data || [])
      .map(m => ({ id: m.id, label: m.display_name || m.id }))
      .sort((a, b) => b.id.localeCompare(a.id)); // newest first
  }

  // ── ChatGPT / OpenAI ──────────────────────────────────────────────────────
  async #chatgptModels() {
    const apiKey = process.env.OPENAI_KEY;
    if (!apiKey) return [];

    const client = new OpenAI({ apiKey });
    const res    = await client.models.list();

    return res.data
      .filter(m => /^(gpt-|o1|o3)/.test(m.id))
      .map(m => ({ id: m.id, label: m.id }))
      .sort((a, b) => b.id.localeCompare(a.id)); // newest first
  }
}

module.exports = ModelsController;
