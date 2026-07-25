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

  async getAgentSummaries(agentIds) {
    if (!Array.isArray(agentIds) || agentIds.length === 0) return [];
    const placeholders = agentIds.map(() => '?').join(', ');
    const [rows] = await this.executor.execute(
      `SELECT
         ars.agent_id AS agent_id,
         COUNT(w.id) AS workflow_count,
         COALESCE(SUM(w.state NOT IN ('completed', 'failed', 'cancelled')), 0)
           AS active_workflow_count,
         COALESCE(SUM(w.state = 'failed'), 0) AS failed_workflow_count,
         MAX(w.updated_at) AS last_activity_at,
         ars.lifecycle_state,
         ars.state_version,
         ars.reason AS lifecycle_reason,
         ars.changed_by,
         ars.changed_at
       FROM workflows w
       RIGHT JOIN agent_runtime_states ars
         ON ars.agent_id = w.assigned_agent_id
       WHERE ars.agent_id IN (${placeholders})
       GROUP BY ars.agent_id, w.assigned_agent_id, ars.lifecycle_state,
         ars.state_version, ars.reason, ars.changed_by, ars.changed_at`,
      agentIds,
    );
    return rows.map((row) => Object.freeze({
      agentId: row.agent_id,
      workflowCount: Number(row.workflow_count || 0),
      activeWorkflowCount: Number(row.active_workflow_count || 0),
      failedWorkflowCount: Number(row.failed_workflow_count || 0),
      lastActivityAt: row.last_activity_at || null,
      lifecycleStatus: row.lifecycle_state,
      stateVersion: Number(row.state_version),
      lifecycleReason: row.lifecycle_reason || null,
      changedBy: row.changed_by,
      changedAt: row.changed_at,
    }));
  }
}

module.exports = MysqlDashboardReadRepository;
