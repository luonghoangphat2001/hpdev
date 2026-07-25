'use strict';

const crypto = require('crypto');
const { AppError } = require('../../../middlewares/error.middleware');

const TRANSITIONS = Object.freeze({
  DRAFT: Object.freeze(['TESTING', 'RETIRED']),
  TESTING: Object.freeze(['ACTIVE', 'CANARY', 'FIXING', 'QUARANTINED']),
  ACTIVE: Object.freeze(['PAUSED', 'SUSPENDED', 'QUARANTINED', 'TESTING', 'CANARY', 'RETIRED']),
  PAUSED: Object.freeze(['ACTIVE', 'SUSPENDED', 'QUARANTINED', 'FIXING']),
  SUSPENDED: Object.freeze(['ACTIVE', 'FIXING', 'QUARANTINED', 'RETIRED']),
  QUARANTINED: Object.freeze(['FIXING', 'RETIRED']),
  FIXING: Object.freeze(['TESTING', 'QUARANTINED', 'RETIRED']),
  CANARY: Object.freeze(['ACTIVE', 'FIXING', 'QUARANTINED']),
  RETIRED: Object.freeze([]),
});

class PersistentAgentLifecycleService {
  constructor({
    transactionManager,
    repositoryFactory,
    auditRepositoryFactory,
    agentRegistry,
    allowedActorIds,
    clock = () => new Date(),
    idFactory = (prefix) => `${prefix}_${crypto.randomUUID()}`,
  }) {
    this.transactionManager = transactionManager;
    this.repositoryFactory = repositoryFactory;
    this.auditRepositoryFactory = auditRepositoryFactory;
    this.agentRegistry = agentRegistry;
    this.allowedActorIds = new Set(allowedActorIds || []);
    this.clock = clock;
    this.idFactory = idFactory;
  }

  async transition({ agentId, toState, expectedVersion, actorId, reason }) {
    this.#validateCommand({ agentId, toState, expectedVersion, actorId, reason });

    return this.transactionManager.execute(async (connection) => {
      const repository = this.repositoryFactory(connection);
      const current = await repository.findForUpdate(agentId);
      if (!current) throw new AppError(`Agent runtime state not found: ${agentId}`, 404);

      const fromState = current.lifecycle_state;
      if (!TRANSITIONS[fromState]?.includes(toState)) {
        throw new AppError(`Lifecycle transition not allowed: ${fromState} -> ${toState}`, 409);
      }
      if (Number(current.state_version) !== Number(expectedVersion)) {
        throw new AppError('Agent lifecycle state version is stale', 409);
      }

      const changedAt = this.clock().toISOString();
      const changed = await repository.transition(agentId, expectedVersion, {
        lifecycleState: toState,
        reason: reason.trim(),
        changedBy: actorId,
        changedAt,
      });
      if (!changed) throw new AppError('Agent lifecycle state version is stale', 409);
      if (this.auditRepositoryFactory) {
        await this.auditRepositoryFactory(connection).append({
          auditId: this.idFactory('aud'),
          occurredAt: this.clock(),
          correlationId: `agent-lifecycle:${agentId}`,
          actorType: 'ceo',
          actorId,
          auditType: 'agent.lifecycle.transition',
          fromState,
          toState,
          outcome: 'success',
          policyVersion: 'agent-lifecycle-v1',
          details: { agentId, reason: reason.trim(), expectedVersion },
        });
      }

      return Object.freeze({
        agentId,
        fromState,
        lifecycleState: toState,
        stateVersion: Number(expectedVersion) + 1,
        reason: reason.trim(),
        changedBy: actorId,
        changedAt,
      });
    });
  }

  #validateCommand({ agentId, toState, expectedVersion, actorId, reason }) {
    if (!this.allowedActorIds.has(String(actorId))) {
      throw new AppError('Actor is not allowed to control agent lifecycle', 403);
    }
    if (!this.agentRegistry?.get(agentId)) {
      throw new AppError(`Unknown agent: ${agentId}`, 404);
    }
    if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, toState)) {
      throw new AppError(`Invalid lifecycle state: ${toState}`, 400);
    }
    if (!Number.isInteger(Number(expectedVersion)) || Number(expectedVersion) < 1) {
      throw new AppError('expectedVersion must be a positive integer', 400);
    }
    if (!reason || !reason.trim()) {
      throw new AppError('Lifecycle transition reason is required', 400);
    }
  }
}

module.exports = PersistentAgentLifecycleService;
module.exports.TRANSITIONS = TRANSITIONS;
