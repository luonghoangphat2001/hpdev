'use strict';

const stateMachine = require('../../../domain/workflows/workflow-state-machine');
const identifiers = require('../../../contracts/identity/correlation-convention');

class WorkflowTransitionService {
  constructor({
    transactionManager,
    workflowRepositoryFactory,
    auditRepositoryFactory,
    machine = stateMachine,
    idFactory = identifiers,
    clock = () => new Date(),
  }) {
    this.transactionManager = transactionManager;
    this.workflowRepositoryFactory = workflowRepositoryFactory;
    this.auditRepositoryFactory = auditRepositoryFactory;
    this.machine = machine;
    this.idFactory = idFactory;
    this.clock = clock;
  }

  async transition(command) {
    return this.transactionManager.execute(async (connection) => {
      const workflows = this.workflowRepositoryFactory(connection);
      const audits = this.auditRepositoryFactory(connection);
      const current = await workflows.findByWorkflowId(command.workflowId);
      if (!current) {
        const error = new Error(`Workflow not found: ${command.workflowId}`);
        error.code = 'workflow_not_found';
        throw error;
      }

      this.machine.assertTransition(current.state, command.toState);
      const completedAt = this.machine.isTerminal(command.toState)
        ? this.clock()
        : null;
      const updated = await workflows.transition(
        command.workflowId,
        command.expectedVersion,
        {
          state: command.toState,
          failureCode: command.failureCode || null,
          failureReason: command.failureReason || null,
          completedAt,
        },
      );

      await audits.append({
        auditId: this.idFactory.createId('audit'),
        occurredAt: this.clock(),
        correlationId: current.correlation_id,
        eventId: current.event_id,
        workflowId: command.workflowId,
        actorType: command.actorType,
        actorId: command.actorId,
        auditType: 'workflow.state_changed',
        fromState: current.state,
        toState: command.toState,
        outcome: 'success',
        policyVersion: current.policy_version,
        details: {
          previous_version: command.expectedVersion,
          new_version: command.expectedVersion + 1,
          reason: command.reason || null,
        },
      });

      return updated;
    });
  }
}

module.exports = WorkflowTransitionService;
