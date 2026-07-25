'use strict';

const crypto = require('crypto');
const { AppError } = require('../../../middlewares/error.middleware');

class ApprovalDecisionService {
  constructor({
    transactionManager,
    approvalRepositoryFactory,
    auditRepositoryFactory,
    allowedApproverIds,
    clock = () => new Date(),
    idFactory = () => `aud_${crypto.randomUUID()}`,
    decisionJournalFactory = null,
  }) {
    this.transactionManager = transactionManager;
    this.approvalRepositoryFactory = approvalRepositoryFactory;
    this.auditRepositoryFactory = auditRepositoryFactory;
    this.allowedApproverIds = new Set(allowedApproverIds || []);
    this.clock = clock;
    this.idFactory = idFactory;
    this.decisionJournalFactory = decisionJournalFactory;
  }

  async decide(command) {
    this.#validate(command);
    const decidedAt = this.clock();
    const result = await this.transactionManager.execute(async (connection) => {
      const approvals = this.approvalRepositoryFactory(connection);
      const approval = await approvals.findByApprovalIdForUpdate(command.approvalId);

      if (!approval) return { outcome: 'not_found' };
      if (approval.status !== 'pending') {
        return { outcome: 'already_decided', approval };
      }
      if (new Date(approval.expires_at).getTime() <= decidedAt.getTime()) {
        await approvals.markExpired(command.approvalId, decidedAt);
        return { outcome: 'expired', approval };
      }

      const status = command.decision === 'approve' ? 'consumed' : 'rejected';
      const changed = await approvals.decidePending(command.approvalId, {
        status,
        expectedVersion: command.decisionVersion,
        actorId: command.actorId,
        reason: command.reason || null,
        decidedAt,
      });
      if (!changed) return { outcome: 'conflict', approval };

      const audit = this.auditRepositoryFactory(connection);
      await audit.append({
        auditId: this.idFactory(),
        occurredAt: decidedAt,
        correlationId: approval.correlation_id,
        eventId: approval.event_id,
        workflowId: approval.workflow_id,
        actionId: approval.action_id,
        approvalId: approval.approval_id,
        actorType: 'ceo',
        actorId: command.actorId,
        auditType: status === 'consumed' ? 'approval_consumed' : 'approval_rejected',
        fromState: 'pending',
        toState: status,
        outcome: 'success',
        details: {
          reason: command.reason || null,
          decisionVersion: command.decisionVersion,
        },
      });
      if (this.decisionJournalFactory) {
        await this.decisionJournalFactory(connection).record({
          workflowId: approval.workflow_id,
          approvalId: approval.approval_id,
          actorId: command.actorId,
          decisionType: 'approval',
          decision: command.decision,
          rationale: command.reason || `CEO ${command.decision}`,
          inputSnapshot: typeof approval.request_snapshot === 'string'
            ? JSON.parse(approval.request_snapshot)
            : approval.request_snapshot,
          policyVersion: approval.policy_version || '1.0.0',
        });
      }

      return {
        outcome: 'decided',
        approval: {
          approval_id: approval.approval_id,
          workflow_id: approval.workflow_id,
          action_id: approval.action_id,
          status,
          decision_version: command.decisionVersion + 1,
          decided_by: command.actorId,
          decided_at: decidedAt.toISOString(),
        },
      };
    });

    return this.#unwrap(result);
  }

  #validate(command = {}) {
    if (!command.approvalId) throw new AppError('approvalId is required', 400);
    if (!['approve', 'reject'].includes(command.decision)) {
      throw new AppError('decision must be approve or reject', 400);
    }
    if (!Number.isInteger(command.decisionVersion) || command.decisionVersion < 1) {
      throw new AppError('decisionVersion must be a positive integer', 400);
    }
    if (!command.actorId || !this.allowedApproverIds.has(String(command.actorId))) {
      throw new AppError('Approver is not authorized', 403);
    }
    if (command.reason && String(command.reason).length > 2000) {
      throw new AppError('reason must not exceed 2000 characters', 400);
    }
  }

  #unwrap(result) {
    const errors = {
      not_found: ['Approval not found', 404, 'approval_not_found'],
      already_decided: ['Approval was already decided', 409, 'approval_replay_blocked'],
      expired: ['Approval has expired', 410, 'approval_expired'],
      conflict: ['Approval decision conflict', 409, 'approval_decision_conflict'],
    };
    if (result.outcome === 'decided') return Object.freeze(result.approval);
    const [message, statusCode, code] = errors[result.outcome];
    throw new AppError(message, statusCode, {
      code,
      currentStatus: result.approval?.status,
    });
  }
}

module.exports = ApprovalDecisionService;
