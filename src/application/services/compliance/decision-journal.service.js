'use strict';

const crypto = require('crypto');
const { stableSerialize } = require('../../../contracts/identity/correlation-convention');
const MemoryPolicy = require('../../../domain/memory/memory-policy');
const { AppError } = require('../../../middlewares/error.middleware');

class DecisionJournalService {
  constructor({
    repository,
    redactionPolicy = new MemoryPolicy(),
    clock = () => new Date(),
    idFactory = () => `dec_${crypto.randomUUID()}`,
  }) {
    this.repository = repository;
    this.redactionPolicy = redactionPolicy;
    this.clock = clock;
    this.idFactory = idFactory;
  }

  async record(input) {
    if (!input.actorId || !input.decisionType || !input.decision
      || !input.rationale || !input.policyVersion) {
      throw new TypeError(
        'Decision requires actor, type, decision, rationale, and policy version'
      );
    }
    const inputSnapshot = this.redactionPolicy.redact(input.inputSnapshot || {});
    const entry = Object.freeze({
      decisionId: input.decisionId || this.idFactory(),
      workflowId: input.workflowId || null,
      goalId: input.goalId || null,
      approvalId: input.approvalId || null,
      actorId: String(input.actorId),
      decisionType: input.decisionType,
      decision: input.decision,
      rationale: input.rationale,
      inputSnapshot,
      inputHash: crypto.createHash('sha256')
        .update(stableSerialize(inputSnapshot))
        .digest('hex'),
      policyVersion: input.policyVersion,
      expectedOutcome: input.expectedOutcome || null,
      decidedAt: input.decidedAt || this.clock(),
    });
    return this.repository.create(entry);
  }

  async recordOutcome(decisionId, {
    status,
    outcome,
  }) {
    if (!['positive', 'neutral', 'negative'].includes(status)) {
      throw new TypeError('Invalid decision outcome status');
    }
    const changed = await this.repository.recordOutcome(
      decisionId,
      this.redactionPolicy.redact(outcome || {}),
      status,
      this.clock(),
    );
    if (!changed) throw new AppError('Decision outcome was already recorded', 409);
    return Object.freeze({ decisionId, status });
  }
}

module.exports = DecisionJournalService;
