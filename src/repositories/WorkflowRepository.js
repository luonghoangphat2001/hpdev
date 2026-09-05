/**
 * @fileoverview WorkflowRepository - Provides workflow functionality.
 */
"use strict";

const OptimisticLockError = require("@utils/errors/optimistic-lock.error");

/**
 * WorkflowRepository
 * Manages workflow logic.
 */
class WorkflowRepository {
  /**
   * constructor - Executes constructor.
   * @param {*} executor - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(executor) {
    this.executor = executor;
  }

  // --- Workflow Core Methods ---
  /**
   * create - Asynchronously executes create.
   * @param {*} workflow - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * findByWorkflowId - Asynchronously executes find by workflow id.
   * @param {*} workflowId - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * findPortfolioCandidates - Asynchronously executes find portfolio candidates.
   * @param {*} limit - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * updatePriority - Asynchronously executes update priority.
   * @param {*} workflowId - Input parameter.
   * @param {*} expectedVersion - Input parameter.
   * @param {*} priority - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

  // --- Workflow Action Methods ---
  /**
   * findReconciliationCandidates - Asynchronously executes find reconciliation candidates.
   * @param {*} before - Input parameter.
   * @param {*} limit - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async findReconciliationCandidates(before, limit) {
    const [rows] = await this.executor.execute(
      `SELECT wa.*, w.event_id, w.correlation_id
       FROM workflow_actions wa
       INNER JOIN workflows w ON w.workflow_id = wa.workflow_id
       WHERE wa.status IN ('executing', 'unknown') AND wa.started_at < ?
       ORDER BY wa.started_at ASC LIMIT ?`,
      [before, limit],
    );
    return rows;
  }

  /**
   * markCompleted - Asynchronously executes mark completed.
   * @param {*} actionId - Input parameter.
   * @param {*} receipt - Input parameter.
   * @param {*} receiptHash - Input parameter.
   * @param {*} completedAt - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async markCompleted(actionId, receipt, receiptHash, completedAt) {
    await this.executor.execute(
      `UPDATE workflow_actions
       SET status = 'completed', ssot_receipt = ?, receipt_hash = ?,
           completed_at = ?, last_error_code = NULL, last_error_message = NULL
       WHERE action_id = ? AND status IN ('executing', 'unknown')`,
      [JSON.stringify(receipt), receiptHash, completedAt, actionId],
    );
  }

  /**
   * markRetryQueued - Asynchronously executes mark retry queued.
   * @param {*} actionId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async markRetryQueued(actionId) {
    await this.executor.execute(
      `UPDATE workflow_actions SET status = 'retry_queued'
       WHERE action_id = ? AND status IN ('executing', 'unknown')`,
      [actionId],
    );
  }

  /**
   * markManualReview - Asynchronously executes mark manual review.
   * @param {*} actionId - Input parameter.
   * @param {*} failure - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async markManualReview(actionId, failure) {
    await this.executor.execute(
      `UPDATE workflow_actions
       SET status = 'manual_review', last_error_code = ?, last_error_message = ?
       WHERE action_id = ? AND status IN ('executing', 'unknown')`,
      [failure.code, failure.message, actionId],
    );
  }

  // --- Goal Methods ---
  /**
   * create - Asynchronously executes create.
   * @param {*} goal - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async create(goal) {
    await this.executor.execute(
      `INSERT INTO goals (
         goal_id, parent_goal_id, horizon, title, description, owner_type,
         owner_id, target, progress, status, starts_at, deadline_at, version
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.goalId, goal.parentGoalId, goal.horizon, goal.title, goal.description,
        goal.ownerType, goal.ownerId, JSON.stringify(goal.target), goal.progress,
        goal.status, goal.startsAt, goal.deadlineAt, goal.version,
      ],
    );
    return goal;
  }

  /**
   * findById - Asynchronously executes find by id.
   * @param {*} goalId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async findById(goalId) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM goals WHERE goal_id = ? LIMIT 1',
      [goalId],
    );
    return rows[0] || null;
  }

  /**
   * update - Asynchronously executes update.
   * @param {*} goal - Input parameter.
   * @param {*} expectedVersion - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async update(goal, expectedVersion) {
    const [result] = await this.executor.execute(
      `UPDATE goals SET status = ?, progress = ?, version = version + 1
       WHERE goal_id = ? AND version = ?`,
      [goal.status, goal.progress, goal.goalId, expectedVersion],
    );
    if (result.affectedRows !== 1) {
      throw new OptimisticLockError('goal', goal.goalId, expectedVersion);
    }
    return goal;
  }

  // --- Dead Letter Methods ---
  /**
   * create - Asynchronously executes create.
   * @param {*} item - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async create(item) {
    await this.executor.execute(
      `INSERT INTO dead_letters (
        dead_letter_id, source_type, source_id, event_id, workflow_id,
        action_id, correlation_id, payload_snapshot, payload_hash,
        error_code, error_class, error_message, error_details, attempt_count,
        first_failed_at, last_failed_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
      ON DUPLICATE KEY UPDATE
        attempt_count = VALUES(attempt_count),
        last_failed_at = VALUES(last_failed_at),
        error_code = VALUES(error_code),
        error_message = VALUES(error_message)`,
      [
        item.deadLetterId,
        item.sourceType,
        item.sourceId,
        item.eventId || null,
        item.workflowId || null,
        item.actionId || null,
        item.correlationId,
        JSON.stringify(item.payloadSnapshot),
        item.payloadHash,
        item.errorCode,
        item.errorClass || null,
        item.errorMessage,
        JSON.stringify(item.errorDetails || {}),
        item.attemptCount,
        item.firstFailedAt,
        item.lastFailedAt,
      ],
    );
    return item;
  }
}

module.exports = WorkflowRepository;
