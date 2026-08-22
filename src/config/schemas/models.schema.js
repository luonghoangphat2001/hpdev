'use strict';

/**
 * Schema definitions for platform-wide and provider-specific AI models.
 */
const MODEL_CONFIG_SCHEMA = [
  // Platform Default Active Models
  {
    key: 'active_model',
    type: 'string',
    allowEmpty: false,
    category: 'platform_model',
  },
  {
    key: 'learning_active_model',
    type: 'string',
    allowEmpty: false,
    category: 'platform_model',
  },
  {
    key: 'discord_active_model',
    type: 'string',
    allowEmpty: false,
    category: 'platform_model',
  },
  {
    key: 'telegram_active_model',
    type: 'string',
    allowEmpty: false,
    category: 'platform_model',
  },

  // Primary Provider Version Selectors
  {
    key: 'gemini_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'claude_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'chatgpt_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },

  // Extended Provider Models
  {
    key: 'deepseek_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'vllm_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'kimi_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'ollama_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'nvidia_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'cloudflare_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },

  // Provider Proxy Endpoints
  {
    key: 'claude_base_url',
    type: 'string',
    category: 'provider_network',
    envFallbacks: [
      'CLAUDE_API_BASE_URL',
      'CLAUDE_BASE_URL',
    ],
  },
];

module.exports = {
  MODEL_CONFIG_SCHEMA,
};
