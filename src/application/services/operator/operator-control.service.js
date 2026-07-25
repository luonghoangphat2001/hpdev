'use strict';

const crypto = require('crypto');
const stateMachine = require('../../../domain/workflows/workflow-state-machine');
const { AppError } = require('../../../middlewares/error.middleware');

class OperatorControlService {
  constructor({
    transactionManager,
    repositoryFactory,
    auditRepositoryFactory,
    allowedOperatorIds,
    clock = () => new Date(),
    idFactory = (prefix) => `${prefix}_${crypto.randomUUID()}`,
  }) {
    this.transactionManager = transactionManager;
    this.repositoryFactory = repositoryFactory;
    this.auditRepositoryFactory = auditRepositoryFactory;
    this.allowedOperatorIds = new Set(allowedOperatorIds || []);
    this.clock = clock;
    this.idFactory = idFactory;
  }

  async control(command) {
    this.#authorize(command.actorId);
    if (!['pause', 'resume', 'cancel'].includes(command.operation)) {
      throw new AppError('operation must be pause, resume, or cancel', 400);
    }
    if (!Number.isInteger(command.expectedVersion) || command.expectedVersion < 1) {
      throw new AppError('expectedVersion must be a positive integer', 400);
    }
    return this.transactionManager.execute(async (connection) => {
      const repository = this.repositoryFactory(connection);
      const current = await repository.findWorkflowForUpdate(command.workflowId);
      if (!current) throw new AppError('Workflow not found', 404);
      const toState = this.#targetState(command.operation, current);
      stateMachine.assertTransition(current.state, toState);
      const changed = await repository.changeState(
        command.workflowId,
        command.expectedVersion,
        {
          state: toState,
          pausedFromState: command.operation === 'pause' ? current.state : null,
          completedAt: toState === 'cancelled' ? this.clock() : null,
        },
      );
      if (!changed) throw new AppError('Workflow control conflict', 409);
      await this.auditRepositoryFactory(connection).append({
        auditId: this.idFactory('aud'),
        occurredAt: this.clock(),
        correlationId: current.correlation_id,
        eventId: current.event_id,
        workflowId: current.workflow_id,
        actorType: 'ceo',
        actorId: command.actorId,
        auditType: `workflow.${command.operation}`,
        fromState: current.state,
        toState,
        outcome: 'success',
        policyVersion: current.policy_version,
        details: { reason: command.reason || null },
      });
      return Object.freeze({
        workflowId: current.workflow_id,
        state: toState,
        stateVersion: command.expectedVersion + 1,
      });
    });
  }

  async feedback(command) {
    this.#authorize(command.actorId);
    if (!Number.isInteger(command.rating) || command.rating < 1 || command.rating > 5) {
      throw new AppError('rating must be an integer from 1 to 5', 400);
    }
    if (command.comment && command.comment.length > 2000) {
      throw new AppError('comment must not exceed 2000 characters', 400);
    }
    const feedback = Object.freeze({
      feedbackId: this.idFactory('fdb'),
      workflowId: command.workflowId,
      actorId: command.actorId,
      rating: command.rating,
      comment: command.comment || null,
    });
    return this.transactionManager.execute((connection) =>
      this.repositoryFactory(connection).saveFeedback(feedback));
  }

  #targetState(operation, current) {
    if (operation === 'pause') return 'paused';
    if (operation === 'cancel') return 'cancelled';
    if (!current.paused_from_state) throw new AppError('Workflow has no resumable state', 409);
    return current.paused_from_state;
  }

  #authorize(actorId) {
    if (!actorId || !this.allowedOperatorIds.has(String(actorId))) {
      throw new AppError('Operator is not authorized', 403);
    }
  }
}

module.exports = OperatorControlService;
