/**
 * @fileoverview agent-autonomy.service - Provides agent-autonomy functionality.
 */
'use strict';

const agentRegistry = require('../agents/agent-registry');
const { LEVELS } = require('../../../policy/permissions/agent-autonomy.policy');
const AppError = require('../../../utils/errors/app.error');

/**
 * AgentAutonomyService
 * Manages agent autonomy logic.
 */
class AgentAutonomyService {
  constructor({
    repository,
    agents = agentRegistry,
    allowedActorIds = [],
    clock = () => new Date(),
  }) {
    this.repository = repository;
    this.agents = agents;
    this.allowedActorIds = new Set(allowedActorIds);
    this.clock = clock;
  }

  async configure({
    agentId,
    goalId = null,
    autonomyLevel,
    limits = {},
    enabled = true,
    actorId,
    expectedVersion = null,
  }) {
    if (!this.allowedActorIds.has(String(actorId))) {
      throw new AppError('CEO actor is not authorized', 403);
    }
    if (!this.agents.get(agentId)) throw new TypeError('Unknown agent');
    if (!LEVELS.includes(autonomyLevel)) throw new TypeError('Invalid autonomy level');
    Object.entries(limits).forEach(([key, value]) => {
      if (!Number.isFinite(Number(value)) || Number(value) < 0) {
        throw new TypeError(`Invalid autonomy limit: ${key}`);
      }
    });
    const settings = Object.freeze({
      agentId,
      goalId,
      autonomyLevel,
      limits: Object.freeze({ ...limits }),
      enabled: Boolean(enabled),
      changedBy: String(actorId),
      changedAt: this.clock(),
    });
    await this.repository.upsert(settings, expectedVersion);
    return settings;
  }
}

module.exports = AgentAutonomyService;
