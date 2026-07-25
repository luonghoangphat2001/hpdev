'use strict';

const WorkflowActionRepository = require('../../../domain/repositories/workflow-action.repository');

class MysqlWorkflowActionRepository extends WorkflowActionRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

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

  async markCompleted(actionId, receipt, receiptHash, completedAt) {
    await this.executor.execute(
      `UPDATE workflow_actions
       SET status = 'completed', ssot_receipt = ?, receipt_hash = ?,
           completed_at = ?, last_error_code = NULL, last_error_message = NULL
       WHERE action_id = ? AND status IN ('executing', 'unknown')`,
      [JSON.stringify(receipt), receiptHash, completedAt, actionId],
    );
  }

  async markRetryQueued(actionId) {
    await this.executor.execute(
      `UPDATE workflow_actions SET status = 'retry_queued'
       WHERE action_id = ? AND status IN ('executing', 'unknown')`,
      [actionId],
    );
  }

  async markManualReview(actionId, failure) {
    await this.executor.execute(
      `UPDATE workflow_actions
       SET status = 'manual_review', last_error_code = ?, last_error_message = ?
       WHERE action_id = ? AND status IN ('executing', 'unknown')`,
      [failure.code, failure.message, actionId],
    );
  }
}

module.exports = MysqlWorkflowActionRepository;
