'use strict';

const WorkflowRepository = require('../../../domain/repositories/workflow.repository');
const OptimisticLockError = require('../../../domain/errors/optimistic-lock.error');

class MysqlWorkflowRepository extends WorkflowRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

  async create(workflow) {
    await this.executor.execute(
      `INSERT INTO workflows (
        workflow_id, event_id, correlation_id, workflow_type, state,
        assigned_agent_id, risk_level, priority, policy_version, input_context
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workflow.workflowId,
        workflow.eventId,
        workflow.correlationId,
        workflow.workflowType,
        workflow.state || 'received',
        workflow.assignedAgentId || null,
        workflow.riskLevel,
        workflow.priority ?? 50,
        workflow.policyVersion,
        JSON.stringify(workflow.inputContext || {}),
      ],
    );
    return this.findByWorkflowId(workflow.workflowId);
  }

  async findByWorkflowId(workflowId) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM workflows WHERE workflow_id = ? LIMIT 1',
      [workflowId],
    );
    return rows[0] || null;
  }

  async transition(workflowId, expectedVersion, {
    state,
    failureCode = null,
    failureReason = null,
    completedAt = null,
  }) {
    const [result] = await this.executor.execute(
      `UPDATE workflows
       SET state = ?, state_version = state_version + 1,
           failure_code = ?, failure_reason = ?, completed_at = ?
       WHERE workflow_id = ? AND state_version = ?`,
      [
        state,
        failureCode,
        failureReason,
        completedAt,
        workflowId,
        expectedVersion,
      ],
    );

    if (result.affectedRows !== 1) {
      throw new OptimisticLockError('workflow', workflowId, expectedVersion);
    }

    return this.findByWorkflowId(workflowId);
  }

  async findPortfolioCandidates(limit = 200) {
    const [rows] = await this.executor.execute(
      `SELECT * FROM workflows
       WHERE state IN ('received', 'queued', 'paused')
       ORDER BY priority DESC, created_at ASC
       LIMIT ? FOR UPDATE`,
      [Math.min(Math.max(Number(limit) || 200, 1), 500)],
    );
    return rows;
  }

  async updatePriority(workflowId, expectedVersion, priority) {
    const [result] = await this.executor.execute(
      `UPDATE workflows
       SET priority = ?, state_version = state_version + 1
       WHERE workflow_id = ? AND state_version = ?`,
      [priority, workflowId, expectedVersion],
    );
    if (result.affectedRows !== 1) {
      throw new OptimisticLockError('workflow', workflowId, expectedVersion);
    }
    return true;
  }
}

module.exports = MysqlWorkflowRepository;
