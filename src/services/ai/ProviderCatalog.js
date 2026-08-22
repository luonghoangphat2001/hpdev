'use strict';

const PROVIDER_ORDER = ['claude', 'chatgpt', 'gemini', 'deepseek', 'vllm', 'kimi', 'ollama', 'nvidia', 'cloudflare'];

const PROVIDER_META = {
  claude:   { key: 'claude',   label: 'Claude 🧠',   shortLabel: 'Claude',   icon: '✳️' },
  chatgpt:  { key: 'chatgpt',  label: 'ChatGPT 🤖', shortLabel: 'ChatGPT',  icon: '🤖' },
  gemini:   { key: 'gemini',   label: 'Gemini ✨',   shortLabel: 'Gemini',   icon: '🌟' },
  deepseek: { key: 'deepseek', label: 'DeepSeek 🌊', shortLabel: 'DeepSeek', icon: '🌊' },
  vllm:     { key: 'vllm',     label: 'vLLM ⚡',     shortLabel: 'vLLM',     icon: '⚡' },
  kimi:     { key: 'kimi',     label: 'Kimi',       shortLabel: 'Kimi',     icon: '🧠' },
  ollama:   { key: 'ollama',   label: 'Ollama',     shortLabel: 'Ollama',   icon: '🦙' },
  nvidia:   { key: 'nvidia',   label: 'NVIDIA NIM 🟢', shortLabel: 'NVIDIA', icon: '🟢' },
  cloudflare: { key: 'cloudflare', label: 'Cloudflare AI ☁️', shortLabel: 'Cloudflare', icon: '☁️' },
  'web-search': { key: 'web-search', label: 'Web Search 🌐', shortLabel: 'Web Search', icon: '🌐' },
};

const MODEL_SWITCH_ALIASES = {
  claude:   ['claude'],
  chatgpt:  ['chatgpt', 'gpt', 'openai'],
  gemini:   ['gemini'],
  deepseek: ['deepseek'],
  vllm:     ['vllm'],
  kimi:     ['kimi'],
  ollama:   ['ollama'],
  nvidia:   ['nvidia', 'nim'],
  cloudflare: ['cloudflare', 'cf', 'workers-ai'],
};

function getProviderMeta(providerKey) {
  return PROVIDER_META[providerKey] || { key: providerKey, label: providerKey, shortLabel: providerKey, icon: '🤖' };
}

function getProviderOrder() {
  return [...PROVIDER_ORDER];
}

function getProviderLabels() {
  return PROVIDER_ORDER.map((key) => getProviderMeta(key));
}

function getFallbackVersion(providerKey, configRepo, env = process.env) {
  switch (providerKey) {
    case 'gemini':
      return configRepo.get('gemini_model') || 'models/gemini-2.5-flash';
    case 'claude':
      return configRepo.get('claude_model') || 'claude-sonnet-4-6';
    case 'chatgpt':
      return configRepo.get('chatgpt_model') || 'gpt-4o';
    case 'deepseek':
      return env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
    case 'vllm':
      return env.VLLM_MODEL || 'llama3.1';
    case 'kimi':
      return env.KIMI_MODEL || 'kimi-k2.6';
    case 'ollama':
      return env.OLLAMA_MODEL || 'llama3.1';
    case 'nvidia':
      return env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';
    case 'cloudflare':
      return env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.1-8b-instruct';
    default:
      return providerKey;
  }
}

function getAliasMap() {
  return MODEL_SWITCH_ALIASES;
}

module.exports = {
  PROVIDER_ORDER,
  PROVIDER_META,
  MODEL_SWITCH_ALIASES,
  getProviderMeta,
  getProviderOrder,
  getProviderLabels,
  getFallbackVersion,
  getAliasMap,
};
