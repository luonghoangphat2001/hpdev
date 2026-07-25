'use strict';

class MysqlDashboardReadRepository {
  constructor(executor) {
    if (!executor || typeof executor.execute !== 'function') {
      throw new TypeError('Dashboard read repository requires a database executor');
    }
    this.executor = executor;
  }

  async getOverview() {
    const [rows] = await this.executor.execute(
      `SELECT
         (SELECT COUNT(*) FROM workflows
          WHERE state NOT IN ('completed', 'failed', 'cancelled')) AS active_workflow_count,
         (SELECT COUNT(*) FROM approval_requests
          WHERE status = 'pending') AS pending_approval_count,
         (SELECT COUNT(*) FROM dead_letters
          WHERE status IN ('pending', 'retrying')) AS unresolved_dead_letter_count,
         (SELECT COUNT(*) FROM ceo_exceptions
          WHERE status = 'open') AS open_exception_count`,
    );

    const row = rows[0] || {};
    return Object.freeze({
      activeWorkflowCount: Number(row.active_workflow_count || 0),
      pendingApprovalCount: Number(row.pending_approval_count || 0),
      unresolvedDeadLetterCount: Number(row.unresolved_dead_letter_count || 0),
      openExceptionCount: Number(row.open_exception_count || 0),
    });
  }
}

module.exports = MysqlDashboardReadRepository;
