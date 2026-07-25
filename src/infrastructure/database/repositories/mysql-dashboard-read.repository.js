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

  async listWorkflows({
    limit = 50,
    offset = 0,
    agentId = null,
    state = null,
    search = null,
  } = {}) {
    const clauses = [];
    const params = [];
    if (agentId) {
      clauses.push('assigned_agent_id = ?');
      params.push(agentId);
    }
    if (state) {
      clauses.push('state = ?');
      params.push(state);
    }
    if (search) {
      clauses.push('(workflow_id LIKE ? OR correlation_id LIKE ? OR workflow_type LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await this.executor.execute(
      `SELECT workflow_id, correlation_id, workflow_type, state, state_version,
              assigned_agent_id, risk_level, priority, failure_code,
              failure_reason, deadline_at, created_at, updated_at, completed_at
       FROM workflows
       ${where}
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const [countRows] = await this.executor.execute(
      `SELECT COUNT(*) AS total FROM workflows ${where}`,
      params,
    );
    return Object.freeze({
      rows,
      total: Number(countRows[0]?.total || 0),
    });
  }

  async getWorkflowDetail(workflowId) {
    const [workflowRows] = await this.executor.execute(
      `SELECT workflow_id, event_id, correlation_id, workflow_type, state,
              state_version, assigned_agent_id, risk_level, priority,
              policy_version, failure_code, failure_reason, queued_at,
              started_at, completed_at, deadline_at, created_at, updated_at
       FROM workflows WHERE workflow_id = ? LIMIT 1`,
      [workflowId],
    );
    if (!workflowRows[0]) return null;

    const [actionRows] = await this.executor.execute(
      `SELECT action_id, sequence_no, action_name, permission_scope, status,
              risk_level, retry_count, max_attempts, last_error_code,
              last_error_message, scheduled_at, started_at, completed_at,
              created_at, updated_at
       FROM workflow_actions
       WHERE workflow_id = ?
       ORDER BY sequence_no ASC`,
      [workflowId],
    );
    const [approvalRows] = await this.executor.execute(
      `SELECT approval_id, action_id, status, risk_level, requested_by,
              expires_at, decided_by, decided_at, decision_reason,
              decision_version, created_at, updated_at
       FROM approval_requests
       WHERE workflow_id = ?
       ORDER BY created_at ASC`,
      [workflowId],
    );
    const [auditRows] = await this.executor.execute(
      `SELECT audit_id, occurred_at, actor_type, actor_id, audit_type,
              from_state, to_state, outcome, policy_version
       FROM audit_events
       WHERE workflow_id = ?
       ORDER BY occurred_at ASC, id ASC`,
      [workflowId],
    );

    return Object.freeze({
      workflow: workflowRows[0],
      actions: actionRows,
      approvals: approvalRows,
      timeline: auditRows,
    });
  }
}

module.exports = MysqlDashboardReadRepository;
