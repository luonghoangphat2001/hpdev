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
    // Refresh config cache so model changes from the dashboard are picked up
    // even though bot.js and app.js run in separate processes.
    await this.#configRepo.refreshIfNeeded();

    const configKey   = platform ? `${platform}_active_model` : 'active_model';
    const activeModel = this.#configRepo.get(configKey) || this.#configRepo.get('active_model') || 'gemini';
    const systemPrompt = this.#configRepo.get('system_prompt') || 'You are a helpful assistant.';

    const history = await this.#conversationRepo.findByChannel(channelId, 10);
    const messages = [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: prompt },
    ];

    console.log(`[AIService] chat | platform=${platform} model=${activeModel} user=${username}(${userId}) channel=${channelId} prompt="${prompt.slice(0, 80)}${prompt.length > 80 ? '…' : ''}"`);

    // Resolve the specific model version string for accurate stats
    // (e.g. "models/gemini-2.5-flash" instead of just "gemini")
    let usedProvider = activeModel;
    let result;
    const t0 = Date.now();
    try {
      result = await this.#createProvider(activeModel).chat(messages, systemPrompt);
    } catch (err) {
      if (err.status === 429 && activeModel !== 'gemini') {
        console.warn(`[AIService] 429 from ${activeModel}, falling back to gemini`);
        result      = await this.#createProvider('gemini').chat(messages, systemPrompt);
        usedProvider = 'gemini'; // credit tokens to the provider that actually ran
      } else {
        console.error(`[AIService] Provider error (${activeModel}):`, err.message);
        throw err;
      }
    }
    const elapsed   = Date.now() - t0;
    const text      = result.text      ?? result;
    const tokensIn  = result.tokensIn  ?? 0;
    const tokensOut = result.tokensOut ?? 0;

    // Save the actual model version name so stats are meaningful
    const savedModel = this.#resolveModelVersion(usedProvider);

    console.log(`[AIService] done  | model=${savedModel} tokens=${tokensIn}in/${tokensOut}out time=${elapsed}ms reply="${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`);

    await this.#conversationRepo.save({ channelId, userId, username, role: 'user', content: prompt, model: savedModel });
    await this.#conversationRepo.save({ channelId, userId: 'bot', username: 'Đần', role: 'assistant', content: text, model: savedModel, tokensIn, tokensOut });

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
    await this.#configRepo.refreshIfNeeded();
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
    const label = this.currentModel(platform).label;
    console.log(`[AIService] model switched | platform=${platform} key=${modelKey} label=${label}`);
    return label;
  }

  /**
   * Map a provider key ('gemini'|'claude'|'chatgpt') to the actual model version
   * string stored in config, so stats show meaningful names.
   * @param {string} providerKey
   * @returns {string}
   */
  #resolveModelVersion(providerKey) {
    const map = {
      gemini:  this.#configRepo.get('gemini_model')  || 'models/gemini-2.5-flash',
      claude:  this.#configRepo.get('claude_model')  || 'claude-sonnet-4-6',
      chatgpt: this.#configRepo.get('chatgpt_model') || 'gpt-4o',
    };
    return map[providerKey] ?? providerKey;
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
