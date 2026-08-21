/**
 * @fileoverview env - Provides env functionality.
 */
'use strict';

require('dotenv').config();

/**
 * EnvConfig
 * Manages env config logic.
 */
class EnvConfig {
  /**
   * constructor - Executes constructor.
   * @param {*} env - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(env = process.env) {
    this.port = env.PORT ? Number(env.PORT) : null;
    this.apiSecret = env.API_SECRET || '';

    const rawSchemaUrl = env.SCHEMA_BASE_URL || 'https://openclaw.hpdev.name.vn/schemas/v1';
    try {
      const parsed = new URL(rawSchemaUrl.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`SCHEMA_BASE_URL must use http: or https: protocol. Received: "${rawSchemaUrl}"`);
      }
      this.schemaBaseUrl = rawSchemaUrl.trim().replace(/\/+$/, '');
    } catch (err) {
      throw new Error(`Invalid SCHEMA_BASE_URL environment variable: "${rawSchemaUrl}". Error: ${err.message}`);
    }

    const rawJsonSchemaDraftUrl = env.JSON_SCHEMA_DRAFT_URL || 'https://json-schema.org/draft/2020-12/schema';
    try {
      const parsedDraft = new URL(rawJsonSchemaDraftUrl.trim());
      if (!['http:', 'https:'].includes(parsedDraft.protocol)) {
        throw new Error(`JSON_SCHEMA_DRAFT_URL must use http: or https: protocol. Received: "${rawJsonSchemaDraftUrl}"`);
      }
      this.jsonSchemaDraftUrl = rawJsonSchemaDraftUrl.trim();
    } catch (err) {
      throw new Error(`Invalid JSON_SCHEMA_DRAFT_URL environment variable: "${rawJsonSchemaDraftUrl}". Error: ${err.message}`);
    }

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
    this.ceoDashboardActorIds = Object.freeze(
      String(env.CEO_DASHBOARD_ACTOR_IDS || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    );
    this.ceoOperatorIds = Object.freeze([
      ...new Set([...this.ceoDiscordUserIds, ...this.ceoDashboardActorIds]),
    ]);
    this.dailyReport = Object.freeze({
      enabled: String(env.DAILY_REPORT_ENABLED || 'false').toLowerCase() === 'true',
      timezone: env.DAILY_REPORT_TIMEZONE || 'Asia/Ho_Chi_Minh',
      time: env.DAILY_REPORT_TIME || '18:00',
      agentTimeoutMs: Number(env.DAILY_REPORT_AGENT_TIMEOUT_MS || 5000),
    });
    this.orchestratorProductionEnabled =
      String(env.ORCHESTRATOR_PRODUCTION_ENABLED || 'false').toLowerCase() === 'true';
    this.intelligenceWarnings = Object.freeze({
      latencyMs: Number(env.INTELLIGENCE_LATENCY_WARNING_MS || 30000),
      tokens: Number(env.INTELLIGENCE_TOKEN_WARNING || 10000),
      costUsd: Number(env.INTELLIGENCE_COST_WARNING_USD || 1),
    });
    this.dailyBrief = Object.freeze({
      enabled: String(env.CEO_DAILY_BRIEF_ENABLED || 'false').toLowerCase() === 'true',
      timezone: env.CEO_DAILY_BRIEF_TIMEZONE || 'Asia/Ho_Chi_Minh',
      time: env.CEO_DAILY_BRIEF_TIME || '18:05',
      sectionTimeoutMs: Number(env.CEO_DAILY_BRIEF_SECTION_TIMEOUT_MS || 5000),
    });
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
