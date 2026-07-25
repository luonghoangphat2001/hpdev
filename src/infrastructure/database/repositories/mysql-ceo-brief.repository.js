'use strict';

class MysqlCeoBriefRepository {
  constructor(executor) {
    this.executor = executor;
  }

  async goalSnapshot() {
    const [rows] = await this.executor.execute(
      `SELECT status, COUNT(*) AS count
       FROM goals WHERE status IN ('active', 'at_risk')
       GROUP BY status`
    );
    return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
  }

  async kpiSnapshot(from, to) {
    const [rows] = await this.executor.execute(
      `SELECT COUNT(*) AS deviations,
              COALESCE(SUM(tokens_in + tokens_out), 0) AS tokens,
              COALESCE(SUM(cost_usd), 0) AS cost_usd
       FROM intelligence_traces
       WHERE occurred_at >= ? AND occurred_at < ?`,
      [from, to],
    );
    return {
      deviations: Number(rows[0]?.deviations || 0),
      tokens: Number(rows[0]?.tokens || 0),
      costUsd: Number(rows[0]?.cost_usd || 0),
    };
  }

  async exceptionSnapshot() {
    const [rows] = await this.executor.execute(
      `SELECT severity, COUNT(*) AS count FROM ceo_exceptions
       WHERE status = 'open' GROUP BY severity`
    );
    return Object.fromEntries(rows.map((row) => [row.severity, Number(row.count)]));
  }

  async approvalSnapshot() {
    const [rows] = await this.executor.execute(
      `SELECT COUNT(*) AS pending FROM approval_requests
       WHERE status = 'pending' AND expires_at > NOW(3)`
    );
    return { pending: Number(rows[0]?.pending || 0) };
  }

  async completedSnapshot(from, to) {
    const [rows] = await this.executor.execute(
      `SELECT assigned_agent_id, COUNT(*) AS count FROM workflows
       WHERE state = 'completed' AND completed_at >= ? AND completed_at < ?
       GROUP BY assigned_agent_id`,
      [from, to],
    );
    return rows.map((row) => ({
      agentId: row.assigned_agent_id,
      count: Number(row.count),
    }));
  }
}

module.exports = MysqlCeoBriefRepository;
