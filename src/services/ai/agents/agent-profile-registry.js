/**
 * @fileoverview agent-profile-registry - Provides agent-profile-registry functionality.
 */
'use strict';

const agentProfileSchema = require('../../../schemas/ai/profile.schema');
const JsonSchemaValidator = require('../../../utils/json-schema.validator');
const { AGENTS } = require('./agent-registry');

/**
 * AgentProfileRegistry
 * Manages agent profile registry logic.
 */
class AgentProfileRegistry {
  constructor({
    profiles = AGENTS,
    validator = new JsonSchemaValidator(),
  } = {}) {
    this.profiles = new Map();
    profiles.forEach((profile) => {
      const result = validator.validate(agentProfileSchema, profile);
      if (!result.valid) {
        throw new TypeError(
          `Invalid agent profile ${profile?.id || 'unknown'}: `
          + result.errors.map(({ path, message }) => `${path} ${message}`).join(', ')
        );
      }
      if (this.profiles.has(profile.id)) throw new TypeError(`Duplicate agent profile: ${profile.id}`);
      this.profiles.set(profile.id, profile);
    });
  }

  /**
   * get - Executes get.
   * @param {*} agentId - Input parameter.
   * @returns {*} Result of operation.
   */
  get(agentId) {
    return this.profiles.get(agentId) || null;
  }

  /**
   * list - Executes list.
   * @returns {*} Result of operation.
   */
  list() {
    return Array.from(this.profiles.values());
  }
}

module.exports = new AgentProfileRegistry();
module.exports.AgentProfileRegistry = AgentProfileRegistry;
