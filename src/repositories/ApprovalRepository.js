/**
 * @fileoverview ApprovalRepository - Provides approval functionality.
 */
'use strict';


/**
 * ApprovalRepository
 * Manages approval logic.
 */
class ApprovalRepository {
  /**
   * constructor - Executes constructor.
   * @param {*} executor - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(executor) {
    this.executor = executor;
  }

  /**
   * findByApprovalIdForUpdate - Asynchronously executes find by approval id for update.
   * @param {*} approvalId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async findByApprovalIdForUpdate(approvalId) {
    const [rows] = await this.executor.execute(
      `SELECT ar.*, w.correlation_id, w.event_id, w.policy_version
       FROM approval_requests ar
       INNER JOIN workflows w ON w.workflow_id = ar.workflow_id
       WHERE ar.approval_id = ?
       LIMIT 1 FOR UPDATE`,
      [approvalId],
    );
    return rows[0] || null;
  }

  async decidePending(approvalId, {
    status,
    expectedVersion,
    actorId,
    reason,
    decidedAt,
  }) {
    const consumed = status === 'consumed';
    const [result] = await this.executor.execute(
      `UPDATE approval_requests
       SET status = ?, decision_version = decision_version + 1,
           decided_by = ?, decision_reason = ?, decided_at = ?,
           consumed_at = ?, consumed_by = ?
       WHERE approval_id = ? AND status = 'pending'
         AND decision_version = ? AND expires_at > ?`,
      [
        status,
        actorId,
        reason,
        decidedAt,
        consumed ? decidedAt : null,
        consumed ? actorId : null,
        approvalId,
        expectedVersion,
        decidedAt,
      ],
    );
    return result.affectedRows === 1;
  }

  /**
   * markExpired - Asynchronously executes mark expired.
   * @param {*} approvalId - Input parameter.
   * @param {*} decidedAt - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async markExpired(approvalId, decidedAt) {
    const [result] = await this.executor.execute(
      `UPDATE approval_requests
       SET status = 'expired', decision_version = decision_version + 1,
           decided_at = ?
       WHERE approval_id = ? AND status = 'pending' AND expires_at <= ?`,
      [decidedAt, approvalId, decidedAt],
    );
    return result.affectedRows === 1;
  }
}

module.exports = ApprovalRepository;
