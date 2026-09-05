'use strict';

const { getProviderLabels } = require('@services/ai/ProviderCatalog');
const { CONFIG_SCHEMA, MONITORED_AGENTS } = require('@schemas/schemas');

/**
 * Service responsible for configuration serialization, deserialization,
 * batch persistence, and lifecycle update hook execution.
 * Follows Single Responsibility and Open-Closed principles.
 */
class ConfigService {
  /** @type {Array<object>} */
  #schema;
  /** @type {Array<string>} */
  #monitoredAgents;

  constructor({ schema = CONFIG_SCHEMA, monitoredAgents = MONITORED_AGENTS } = {}) {
    this.#schema = schema;
    this.#monitoredAgents = monitoredAgents;
  }

  /**
   * Reads all configuration keys and returns a structured DTO for the dashboard.
   * @param {import('../models/ConfigRepository')} configRepo
   * @returns {object}
   */
  export(configRepo) {
    const result = {};

    // 1. Process schema-defined keys
    for (const def of this.#schema) {
      let value = configRepo.get(def.key);

      // Check environment fallbacks if value is empty/null
      if ((value === null || value === undefined || value === '') && def.envFallbacks) {
        for (const envKey of def.envFallbacks) {
          if (process.env[envKey]) {
            value = process.env[envKey];
            break;
          }
        }
      }

      if (def.type === 'number') {
        result[def.key] = Number(value || def.defaultValue || 0);
      } else {
        result[def.key] = value !== null && value !== undefined ? value : '';
      }
    }

    // 2. Process dynamic agent primary & fallback model configurations
    for (const agent of this.#monitoredAgents) {
      for (const role of ['primary', 'fallback']) {
        const key = `agent_${agent}_${role}`;
        result[key] = configRepo.get(key) || '';
      }
    }

    // 3. Attach AI Provider labels for frontend select rendering
    result.ai_providers = getProviderLabels();

    return result;
  }

  /**
   * Applies and persists partial or full configuration updates.
   * Automatically sanitizes inputs and triggers registered side-effect hooks.
   * @param {import('../models/ConfigRepository')} configRepo
   * @param {object} payload
   * @returns {Promise<void>}
   */
  async save(configRepo, payload) {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const updates = [];
    const hooks = [];

    // 1. Process schema fields
    for (const def of this.#schema) {
      const incomingValue = payload[def.key];
      if (incomingValue !== undefined) {
        if (def.allowEmpty === false && !incomingValue) {
          continue;
        }

        let finalValue = incomingValue;
        if (typeof def.transform === 'function') {
          finalValue = def.transform(incomingValue);
        } else {
          finalValue = String(incomingValue);
        }

        updates.push(configRepo.set(def.key, finalValue));

        if (typeof def.onUpdate === 'function') {
          hooks.push(() => {
            return def.onUpdate(finalValue);
          });
        }
      }
    }

    // 2. Process monitored agent models
    for (const agent of this.#monitoredAgents) {
      for (const role of ['primary', 'fallback']) {
        const key = `agent_${agent}_${role}`;
        if (payload[key] !== undefined && payload[key] !== '') {
          updates.push(configRepo.set(key, String(payload[key])));
        }
      }
    }

    // 3. Persist all updates concurrently
    await Promise.all(updates);

    // 4. Run any registered update hooks
    for (const hook of hooks) {
      try {
        hook();
      } catch (err) {
        console.warn(`[ConfigService] Hook execution warning: ${err.message}`);
      }
    }
  }
}

module.exports = ConfigService;
