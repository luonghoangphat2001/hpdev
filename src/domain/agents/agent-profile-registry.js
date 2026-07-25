'use strict';

const agentProfileSchema = require('../../contracts/agents/agent-profile.schema');
const JsonSchemaValidator = require('../../infrastructure/validation/json-schema.validator');
const { AGENTS } = require('./agent-registry');

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

  get(agentId) {
    return this.profiles.get(agentId) || null;
  }

  list() {
    return Array.from(this.profiles.values());
  }
}

module.exports = new AgentProfileRegistry();
module.exports.AgentProfileRegistry = AgentProfileRegistry;
