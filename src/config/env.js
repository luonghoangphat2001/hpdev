'use strict';

require('dotenv').config();

class EnvConfig {
  constructor(env = process.env) {
    this.port = env.PORT || 4000;
    this.apiSecret = env.API_SECRET || '';
    this.serperKey = env.SERPER_KEY || '';
    this.ecommerceWebhookKeysJson = env.ECOMMERCE_WEBHOOK_KEYS_JSON || '';
    this.ecommerceApi = Object.freeze({
      baseUrl: env.ECOMMERCE_API_URL || '',
      agentCode: env.ECOMMERCE_AGENT_CODE || '',
      agentToken: env.ECOMMERCE_AGENT_TOKEN || '',
    });
    this.danAiApi = Object.freeze({
      baseUrl: env.DAN_AI_API_URL || '',
      apiSecret: env.DAN_AI_API_SECRET || '',
      timeoutMs: Number(env.DAN_AI_API_TIMEOUT_MS || 5000),
    });
    this.ceoDiscordUserIds = Object.freeze(
      String(env.CEO_DISCORD_USER_IDS || env.CEO_DISCORD_USER_ID || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    );
    this.orchestratorDatabase = Object.freeze({
      host: env.ORCHESTRATOR_DB_HOST || '127.0.0.1',
      port: Number(env.ORCHESTRATOR_DB_PORT || 3306),
      database: env.ORCHESTRATOR_DB_NAME || 'openclaw_orchestrator',
      user: env.ORCHESTRATOR_DB_USER || 'openclaw_service',
      password: env.ORCHESTRATOR_DB_PASSWORD || '',
      connectionLimit: Number(env.ORCHESTRATOR_DB_POOL_MAX || 10),
      minConnections: Number(env.ORCHESTRATOR_DB_POOL_MIN || 2),
    });
  }
}

module.exports = new EnvConfig();
module.exports.EnvConfig = EnvConfig;
