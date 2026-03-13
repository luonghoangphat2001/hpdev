'use strict';

const AIFactory = require('./ai/AIFactory');

/**
 * AI business-logic service.
 * Orchestrates provider selection, history retrieval, and message persistence.
 */
class AIService {
  /** @type {import('../models/ConfigRepository')} */
  #configRepo;
  /** @type {import('../models/ConversationRepository')} */
  #conversationRepo;

  /**
   * @param {import('../models/ConfigRepository')} configRepo
   * @param {import('../models/ConversationRepository')} conversationRepo
   */
  constructor(configRepo, conversationRepo) {
    this.#configRepo = configRepo;
    this.#conversationRepo = conversationRepo;
  }

  /**
   * Send a message with full channel-history context.
   * Persists both the user message and the AI response.
   *
   * @param {{ channelId: string, userId: string, username: string, prompt: string }} opts
   * @returns {Promise<string>}
   */
  async chat({ channelId, userId, username, prompt, platform = null }) {
    const configKey   = platform ? `${platform}_active_model` : 'active_model';
    const activeModel = this.#configRepo.get(configKey) || this.#configRepo.get('active_model') || 'gemini';
    const systemPrompt = this.#configRepo.get('system_prompt') || 'You are a helpful assistant.';

    const history = await this.#conversationRepo.findByChannel(channelId, 10);
    const messages = [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: prompt },
    ];

    let result;
    try {
      result = await this.#createProvider(activeModel).chat(messages, systemPrompt);
    } catch (err) {
      if (err.status === 429 && activeModel !== 'gemini') {
        console.warn(`[AIService] 429 from ${activeModel}, falling back to gemini`);
        result = await this.#createProvider('gemini').chat(messages, systemPrompt);
      } else {
        throw err;
      }
    }
    const text      = result.text      ?? result;
    const tokensIn  = result.tokensIn  ?? 0;
    const tokensOut = result.tokensOut ?? 0;

    await this.#conversationRepo.save({ channelId, userId, username, role: 'user', content: prompt, model: activeModel });
    await this.#conversationRepo.save({ channelId, userId: 'bot', username: 'Đần', role: 'assistant', content: text, model: activeModel, tokensIn, tokensOut });

    return text;
  }

  /**
   * One-shot chat without history or persistence (used by the web dashboard).
   *
   * @param {Array<{role: string, content: string}>} messages
   * @param {string|null} [modelOverride]
   * @returns {Promise<string>}
   */
  async chatOnce(messages, modelOverride = null) {
    const model = modelOverride || this.#configRepo.get('active_model') || 'gemini';
    const systemPrompt = this.#configRepo.get('system_prompt') || 'You are a helpful assistant.';
    const result = await this.#createProvider(model).chat(messages, systemPrompt);
    return result.text ?? result;
  }

  /**
   * Get the currently active model key and its display label.
   * @returns {{ key: string, label: string }}
   */
  /**
   * Get the currently active model key and its display label.
   * @param {string|null} [platform]
   * @returns {{ key: string, label: string }}
   */
  currentModel(platform = null) {
    const labels = { claude: 'Claude 🧠', chatgpt: 'ChatGPT 🤖', gemini: 'Gemini ✨' };
    const configKey = platform ? `${platform}_active_model` : 'active_model';
    const key = this.#configRepo.get(configKey) || 'gemini';
    return { key, label: labels[key] ?? key };
  }

  /**
   * Switch the active model and persist it.
   * @param {'gemini'|'claude'|'chatgpt'} modelKey
   * @param {string|null} [platform]
   * @returns {Promise<string>} Display label of the new model
   */
  async setModel(modelKey, platform = null) {
    const configKey = platform ? `${platform}_active_model` : 'active_model';
    await this.#configRepo.set(configKey, modelKey);
    return this.currentModel(platform).label;
  }

  /** @param {string} model */
  #createProvider(model) {
    return AIFactory.create(model, {
      geminiModel:  this.#configRepo.get('gemini_model'),
      claudeModel:  this.#configRepo.get('claude_model'),
      claudeBaseUrl: this.#configRepo.get('claude_base_url'),
      chatgptModel: this.#configRepo.get('chatgpt_model'),
    });
  }
}

module.exports = AIService;
