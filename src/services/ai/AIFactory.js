'use strict';

const GeminiProvider = require('./GeminiProvider');
const ClaudeProvider = require('./ClaudeProvider');
const ChatGPTProvider = require('./ChatGPTProvider');
const OpenAICompatibleProvider = require('./OpenAICompatibleProvider');
const CloudflareProvider = require('./CloudflareProvider');

/**
 * Factory for AI providers (Factory Pattern).
 * Centralises provider instantiation so callers never import SDK classes directly.
 */
class AIFactory {
  /**
   * @param {'gemini'|'claude'|'chatgpt'|'kimi'|'deepseek'|'vllm'|'ollama'|'nvidia'|'cloudflare'} providerName
   * @param {{
   *   geminiModel?: string,
   *   claudeModel?: string,
   *   claudeBaseUrl?: string,
   *   chatgptModel?: string,
   *   openaiBaseUrl?: string,
   *   kimiModel?: string,
   *   kimiBaseUrl?: string,
   *   kimiApiKey?: string,
   *   deepseekModel?: string,
   *   deepseekBaseUrl?: string,
   *   vllmModel?: string,
   *   vllmBaseUrl?: string,
   *   ollamaModel?: string,
   *   ollamaBaseUrl?: string,
   *   nvidiaModel?: string,
   *   nvidiaBaseUrl?: string,
   *   cloudflareModel?: string,
   *   cloudflareBaseUrl?: string,
   * }} config
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
      case 'claude':
        return new ClaudeProvider(
          process.env.CLAUDE_KEY,
          claudeModel,
          process.env.CLAUDE_API_BASE_URL ||
          process.env.CLAUDE_BASE_URL ||
          claudeBaseUrl
        );
      case 'chatgpt':
        return new ChatGPTProvider(
          process.env.OPENAI_KEY,
          chatgptModel,
          process.env.OPENAI_BASE_URL || openaiBaseUrl
        );
      case 'kimi': {
        const baseURL = process.env.KIMI_BASE_URL || kimiBaseUrl || 'https://api.moonshot.ai/v1';
        const model = kimiModel || process.env.KIMI_MODEL || 'kimi-k2.6';
        const apiKey = process.env.KIMI_API_KEY || kimiApiKey;
        return new OpenAICompatibleProvider(apiKey, model, baseURL, 'Kimi');
      }
      case 'deepseek': {
        const baseURL = process.env.DEEPSEEK_BASE_URL || deepseekBaseUrl || 'https://api.deepseek.com';
        const model = deepseekModel || process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
        const apiKey = process.env.DEEPSEEK_API_KEY;
        return new OpenAICompatibleProvider(apiKey, model, baseURL, 'DeepSeek');
      }
      case 'vllm': {
        const baseURL = process.env.VLLM_BASE_URL || vllmBaseUrl || 'http://127.0.0.1:8000/v1';
        const model = vllmModel || process.env.VLLM_MODEL || 'llama3.1';
        const apiKey = process.env.VLLM_API_KEY || 'vllm';
        return new OpenAICompatibleProvider(apiKey, model, baseURL, 'vLLM');
      }
      case 'ollama': {
        const baseURL = process.env.OLLAMA_BASE_URL || ollamaBaseUrl || 'http://127.0.0.1:11434/v1';
        const model = ollamaModel || process.env.OLLAMA_MODEL || 'llama3.1';
        const apiKey = process.env.OLLAMA_API_KEY || 'ollama';
        return new OpenAICompatibleProvider(apiKey, model, baseURL, 'Ollama');
      }
      case 'nvidia': {
        const baseURL = process.env.NVIDIA_BASE_URL || nvidiaBaseUrl || 'https://integrate.api.nvidia.com/v1';
        const model = nvidiaModel || process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';
        const apiKey = process.env.NVIDIA_API_KEY;
        return new OpenAICompatibleProvider(apiKey, model, baseURL, 'NVIDIA NIM');
      }
      case 'cloudflare': {
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const baseURL = process.env.CLOUDFLARE_BASE_URL || cloudflareBaseUrl;
        const model = cloudflareModel || process.env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.1-8b-instruct';
        const apiKey = process.env.CLOUDFLARE_API_TOKEN;
        return new CloudflareProvider(apiKey, accountId, model, baseURL);
      }
      default:
        return new GeminiProvider(process.env.GEMINI_KEY, geminiModel);
    }
  }
}

module.exports = AIFactory;
