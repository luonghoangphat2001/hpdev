'use strict';

const ApprovalRepository = require('../../../domain/repositories/approval.repository');

class MysqlApprovalRepository extends ApprovalRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

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

module.exports = MysqlApprovalRepository;
