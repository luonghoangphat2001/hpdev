'use strict';

const GeminiProvider = require('@services/ai/GeminiProvider');
const ClaudeProvider = require('@services/ai/ClaudeProvider');
const ChatGPTProvider = require('@services/ai/ChatGPTProvider');
const OpenAICompatibleProvider = require('@services/ai/OpenAICompatibleProvider');
const CloudflareProvider = require('@services/ai/CloudflareProvider');

/**
 * Factory for AI providers (Factory Pattern).
 * Centralises provider instantiation so callers never import SDK classes directly.
 * Zero || operators.
 */
class AIFactory {
  static #resolveParam(...candidates) {
    for (const val of candidates) {
      if (val !== undefined && val !== null && String(val).trim().length > 0) {
        return String(val).trim();
      }
    }
    return '';
  }

  /**
   * @param {'gemini'|'claude'|'chatgpt'|'kimi'|'deepseek'|'vllm'|'ollama'|'nvidia'|'cloudflare'} providerName
   * @param {Record<string, any>} [config={}]
   * @returns {import('./AIProvider')}
   */
  static create(providerName, {
    geminiModel,
    claudeModel,
    claudeBaseUrl,
    chatgptModel,
    openaiBaseUrl,
    kimiModel,
    kimiBaseUrl,
    kimiApiKey,
    deepseekModel,
    deepseekBaseUrl,
    vllmModel,
    vllmBaseUrl,
    ollamaModel,
    ollamaBaseUrl,
    nvidiaModel,
    nvidiaBaseUrl,
    cloudflareModel,
    cloudflareBaseUrl,
  } = {}) {
    switch (providerName) {
      case 'claude': {
        const apiKey = this.#resolveParam(process.env.CLAUDE_KEY);
        const model = this.#resolveParam(claudeModel, process.env.CLAUDE_MODEL);
        const baseUrl = this.#resolveParam(
          process.env.CLAUDE_API_BASE_URL,
          process.env.CLAUDE_BASE_URL,
          claudeBaseUrl
        );
        return new ClaudeProvider(apiKey, model, baseUrl);
      }
      case 'chatgpt': {
        const apiKey = this.#resolveParam(process.env.OPENAI_KEY);
        const model = this.#resolveParam(chatgptModel, process.env.CHATGPT_MODEL);
        const baseUrl = this.#resolveParam(process.env.OPENAI_BASE_URL, openaiBaseUrl);
        return new ChatGPTProvider(apiKey, model, baseUrl);
      }
      case 'kimi': {
        const apiKey = this.#resolveParam(process.env.KIMI_API_KEY, kimiApiKey);
        const model = this.#resolveParam(kimiModel, process.env.KIMI_MODEL);
        const baseUrl = this.#resolveParam(process.env.KIMI_BASE_URL, kimiBaseUrl);
        return new OpenAICompatibleProvider(apiKey, model, baseUrl, 'Kimi');
      }
      case 'deepseek': {
        const apiKey = this.#resolveParam(process.env.DEEPSEEK_API_KEY);
        const model = this.#resolveParam(deepseekModel, process.env.DEEPSEEK_MODEL);
        const baseUrl = this.#resolveParam(process.env.DEEPSEEK_BASE_URL, deepseekBaseUrl);
        return new OpenAICompatibleProvider(apiKey, model, baseUrl, 'DeepSeek');
      }
      case 'vllm': {
        const apiKey = this.#resolveParam(process.env.VLLM_API_KEY);
        const model = this.#resolveParam(vllmModel, process.env.VLLM_MODEL);
        const baseUrl = this.#resolveParam(process.env.VLLM_BASE_URL, vllmBaseUrl);
        return new OpenAICompatibleProvider(apiKey, model, baseUrl, 'vLLM');
      }
      case 'ollama': {
        const apiKey = this.#resolveParam(process.env.OLLAMA_API_KEY);
        const model = this.#resolveParam(ollamaModel, process.env.OLLAMA_MODEL);
        const baseUrl = this.#resolveParam(process.env.OLLAMA_BASE_URL, ollamaBaseUrl);
        return new OpenAICompatibleProvider(apiKey, model, baseUrl, 'Ollama');
      }
      case 'nvidia': {
        const apiKey = this.#resolveParam(process.env.NVIDIA_API_KEY);
        const model = this.#resolveParam(nvidiaModel, process.env.NVIDIA_MODEL);
        const baseUrl = this.#resolveParam(process.env.NVIDIA_BASE_URL, nvidiaBaseUrl);
        return new OpenAICompatibleProvider(apiKey, model, baseUrl, 'NVIDIA NIM');
      }
      case 'cloudflare': {
        const accountId = this.#resolveParam(process.env.CLOUDFLARE_ACCOUNT_ID);
        const apiKey = this.#resolveParam(process.env.CLOUDFLARE_API_TOKEN);
        const model = this.#resolveParam(cloudflareModel, process.env.CLOUDFLARE_MODEL);
        const baseUrl = this.#resolveParam(process.env.CLOUDFLARE_BASE_URL, cloudflareBaseUrl);
        return new CloudflareProvider(apiKey, accountId, model, baseUrl);
      }
      default: {
        const apiKey = this.#resolveParam(process.env.GEMINI_KEY);
        const model = this.#resolveParam(geminiModel, process.env.GEMINI_MODEL);
        return new GeminiProvider(apiKey, model);
      }
    }
  }
}

module.exports = AIFactory;
