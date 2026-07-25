'use strict';

class MysqlCeoExceptionRepository {
  constructor(executor) {
    this.executor = executor;
  }

  async collectApprovals() {
    return this.#insert(`
      SELECT CONCAT('exc_approval_', approval_id), 'approval', approval_id,
             workflow_id,
             IF(risk_level = 'critical', 'critical', 'high'),
             CONCAT('Approval waiting: ', action_id),
             JSON_OBJECT('actionId', action_id, 'expiresAt', expires_at),
             requested_at
      FROM approval_requests
      WHERE status = 'pending' AND expires_at > NOW(3)
    `);
  }

  async collectDeadLetters() {
    return this.#insert(`
      SELECT CONCAT('exc_dead_', dead_letter_id), 'dead_letter', dead_letter_id,
             workflow_id, 'critical',
             CONCAT('Dead letter: ', error_code),
             JSON_OBJECT('errorCode', error_code, 'attemptCount', attempt_count),
             last_failed_at
      FROM dead_letters WHERE status = 'open'
    `);
  }

  async collectConflicts() {
    return this.#insert(`
      SELECT CONCAT('exc_conflict_', action_id), 'conflict', action_id,
             workflow_id, 'high',
             CONCAT('Action conflict: ', action_name),
             JSON_OBJECT('errorCode', last_error_code),
             updated_at
      FROM workflow_actions
      WHERE status = 'manual_review'
         OR last_error_code = 'resource_version_conflict'
    `);
  }

  async collectKpiDeviations() {
    return this.#insert(`
      SELECT CONCAT('exc_kpi_', span_id), 'kpi_deviation', span_id,
             workflow_id, 'high',
             CONCAT('KPI deviation: ', component_id),
             metadata, occurred_at
      FROM intelligence_traces
      WHERE JSON_EXTRACT(metadata, '$.kpiDeviation') = TRUE
    `);
  }

  async listOpen(limit = 100) {
    const [rows] = await this.executor.execute(
      `SELECT * FROM ceo_exceptions WHERE status = 'open'
       ORDER BY FIELD(severity, 'critical', 'high', 'medium'), occurred_at ASC
       LIMIT ?`,
      [Math.min(Math.max(Number(limit) || 100, 1), 300)],
    );
    return rows;
  }

  async acknowledge(exceptionId, actorId, at) {
    const [result] = await this.executor.execute(
      `UPDATE ceo_exceptions
       SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ?
       WHERE exception_id = ? AND status = 'open'`,
      [actorId, at, exceptionId],
    );
    return result.affectedRows === 1;
  }

  async #insert(selectSql) {
    const [result] = await this.executor.execute(`
      INSERT IGNORE INTO ceo_exceptions (
        exception_id, source_type, source_id, workflow_id, severity,
        title, context, occurred_at
      ) ${selectSql}
    `);
    return Number(result.affectedRows || 0);
  }
}

module.exports = MysqlCeoExceptionRepository;
