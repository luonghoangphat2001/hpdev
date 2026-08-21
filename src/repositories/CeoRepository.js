/**
 * @fileoverview CeoRepository - Provides ceo functionality.
 */
"use strict";

/**
 * CeoRepository
 * Manages ceo logic.
 */
class CeoRepository {
  /**
   * constructor - Executes constructor.
   * @param {*} executor - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(executor) {
    this.executor = executor;
  }

  // --- Command Methods ---
  /**
   * findByIdempotencyKey - Asynchronously executes find by idempotency key.
   * @param {*} key - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async findByIdempotencyKey(key) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM ceo_command_requests WHERE idempotency_key = ? LIMIT 1',
      [key],
    );
    return rows[0] || null;
  }

  /**
   * create - Asynchronously executes create.
   * @param {*} request - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async create(request) {
    await this.executor.execute(
      `INSERT INTO ceo_command_requests (
         request_id, idempotency_key, command_name, command_version,
         actor_id, risk_level, payload, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')`,
      [
        request.requestId,
        request.idempotencyKey,
        request.commandName,
        request.commandVersion,
        request.actorId,
        request.risk,
        JSON.stringify(request.payload),
      ],
    );
    return request;
  }

  /**
   * complete - Asynchronously executes complete.
   * @param {*} requestId - Input parameter.
   * @param {*} result - Input parameter.
   * @param {*} completedAt - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async complete(requestId, result, completedAt) {
    const status = result?.status === 'queued' ? 'queued' : 'completed';
    await this.executor.execute(
      `UPDATE ceo_command_requests
       SET status = ?, result = ?, completed_at = ?
       WHERE request_id = ? AND status = 'processing'`,
      [status, JSON.stringify(result || {}), completedAt, requestId],
    );
  }

  /**
   * fail - Asynchronously executes fail.
   * @param {*} requestId - Input parameter.
   * @param {*} errorCode - Input parameter.
   * @param {*} completedAt - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async fail(requestId, errorCode, completedAt) {
    await this.executor.execute(
      `UPDATE ceo_command_requests
       SET status = 'failed', error_code = ?, completed_at = ?
       WHERE request_id = ? AND status = 'processing'`,
      [errorCode, completedAt, requestId],
    );
  }

  // --- Daily Brief Methods ---
  /**
   * goalSnapshot - Asynchronously executes goal snapshot.
   * @returns {*} Promise resolving result.
   */
  async goalSnapshot() {
    const [rows] = await this.executor.execute(
      `SELECT status, COUNT(*) AS count
       FROM goals WHERE status IN ('active', 'at_risk')
       GROUP BY status`
    );
    return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
  }

  /**
   * kpiSnapshot - Asynchronously executes kpi snapshot.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * exceptionSnapshot - Asynchronously executes exception snapshot.
   * @returns {*} Promise resolving result.
   */
  async exceptionSnapshot() {
    const [rows] = await this.executor.execute(
      `SELECT severity, COUNT(*) AS count FROM ceo_exceptions
       WHERE status = 'open' GROUP BY severity`
    );
    return Object.fromEntries(rows.map((row) => [row.severity, Number(row.count)]));
  }

  /**
   * approvalSnapshot - Asynchronously executes approval snapshot.
   * @returns {*} Promise resolving result.
   */
  async approvalSnapshot() {
    const [rows] = await this.executor.execute(
      `SELECT COUNT(*) AS pending FROM approval_requests
       WHERE status = 'pending' AND expires_at > NOW(3)`
    );
    return { pending: Number(rows[0]?.pending || 0) };
  }

  /**
   * completedSnapshot - Asynchronously executes completed snapshot.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

  // --- Exception Methods ---
  /**
   * collectApprovals - Asynchronously executes collect approvals.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * collectDeadLetters - Asynchronously executes collect dead letters.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * collectConflicts - Asynchronously executes collect conflicts.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * collectKpiDeviations - Asynchronously executes collect kpi deviations.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * listOpen - Asynchronously executes list open.
   * @param {*} limit - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async listOpen(limit = 100) {
    const [rows] = await this.executor.execute(
      `SELECT * FROM ceo_exceptions WHERE status = 'open'
       ORDER BY FIELD(severity, 'critical', 'high', 'medium'), occurred_at ASC
       LIMIT ?`,
      [Math.min(Math.max(Number(limit) || 100, 1), 300)],
    );
    return rows;
  }

  /**
   * acknowledge - Asynchronously executes acknowledge.
   * @param {*} exceptionId - Input parameter.
   * @param {*} actorId - Input parameter.
   * @param {*} at - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

module.exports = CeoRepository;
