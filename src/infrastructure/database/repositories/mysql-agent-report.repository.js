'use strict';

const AgentReportRepository = require('../../../domain/repositories/agent-report.repository');

class MysqlAgentReportRepository extends AgentReportRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

  async summarizeAgent(agentId, from, to) {
    const [rows] = await this.executor.execute(
      `SELECT
         COUNT(*) AS workflow_count,
         COALESCE(SUM(w.state = 'completed'), 0) AS completed_count,
         COALESCE(SUM(w.state = 'failed'), 0) AS failed_count,
         COALESCE(SUM(w.state = 'awaiting_approval'), 0) AS awaiting_approval_count,
         (SELECT COUNT(*) FROM workflow_actions wa
          INNER JOIN workflows aw ON aw.workflow_id = wa.workflow_id
          WHERE aw.assigned_agent_id = ? AND wa.created_at >= ? AND wa.created_at < ?)
           AS action_count
       FROM workflows w
       WHERE w.assigned_agent_id = ? AND w.created_at >= ? AND w.created_at < ?`,
      [agentId, from, to, agentId, from, to],
    );
    const summary = rows[0] || {};
    return Object.freeze({
      workflowCount: Number(summary.workflow_count || 0),
      completedCount: Number(summary.completed_count || 0),
      failedCount: Number(summary.failed_count || 0),
      awaitingApprovalCount: Number(summary.awaiting_approval_count || 0),
      actionCount: Number(summary.action_count || 0),
    });
  }
}

module.exports = MysqlAgentReportRepository;
