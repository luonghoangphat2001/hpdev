/**
 * @fileoverview OperatorRepository - Provides operator functionality.
 */
"use strict";

/**
 * OperatorRepository
 * Manages operator logic.
 */
class OperatorRepository {
  /**
   * constructor - Executes constructor.
   * @param {*} executor - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(executor) {
    this.executor = executor;
  }

  // --- Event Methods ---
  /**
   * createEvent - Asynchronously executes create event.
   * @param {*} event - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async createEvent(event) {
    const sql = `
      INSERT INTO orchestrator_events (
        event_id, schema_version, event_type, source, occurred_at, received_at,
        correlation_id, delivery_id, raw_payload, payload_hash,
        signature_valid, signature_key_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      event.eventId,
      event.schemaVersion,
      event.eventType,
      event.source,
      event.occurredAt,
      event.receivedAt,
      event.correlationId,
      event.deliveryId,
      JSON.stringify(event.rawPayload),
      event.payloadHash,
      event.signatureValid ? 1 : 0,
      event.signatureKeyId,
      event.status || 'received',
    ];
    await this.executor.execute(sql, values);
    return this.findByEventId(event.eventId);
  }

  /**
   * create - Asynchronously executes create.
   * @param {*} data - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async create(data) {
    if (data && data.decisionId) {
      return this.createDecision(data);
    }
    return this.createEvent(data);
  }

  /**
   * findByEventId - Asynchronously executes find by event id.
   * @param {*} eventId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async findByEventId(eventId) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM orchestrator_events WHERE event_id = ? LIMIT 1',
      [eventId],
    );
    return rows[0] || null;
  }

  /**
   * findByDeliveryId - Asynchronously executes find by delivery id.
   * @param {*} deliveryId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async findByDeliveryId(deliveryId) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM orchestrator_events WHERE delivery_id = ? LIMIT 1',
      [deliveryId],
    );
    return rows[0] || null;
  }

  /**
   * updateStatus - Asynchronously executes update status.
   * @param {*} eventId - Input parameter.
   * @param {*} status - Input parameter.
   * @param {*} failure - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async updateStatus(eventId, status, failure = null) {
    const [result] = await this.executor.execute(
      `UPDATE orchestrator_events
       SET status = ?, processing_attempts = processing_attempts + 1,
           last_error_code = ?, last_error_message = ?
       WHERE event_id = ?`,
      [status, failure?.code || null, failure?.message || null, eventId],
    );
    return result.affectedRows === 1;
  }

  // --- Operator Control Methods ---
  /**
   * findWorkflowForUpdate - Asynchronously executes find workflow for update.
   * @param {*} workflowId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async findWorkflowForUpdate(workflowId) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM workflows WHERE workflow_id = ? LIMIT 1 FOR UPDATE',
      [workflowId],
    );
    return rows[0] || null;
  }

  async changeState(workflowId, expectedVersion, {
    state,
    pausedFromState = null,
    completedAt = null,
  }) {
    const [result] = await this.executor.execute(
      `UPDATE workflows
       SET state = ?, paused_from_state = ?, state_version = state_version + 1,
           completed_at = ?
       WHERE workflow_id = ? AND state_version = ?`,
      [state, pausedFromState, completedAt, workflowId, expectedVersion],
    );
    return result.affectedRows === 1;
  }

  /**
   * saveFeedback - Asynchronously executes save feedback.
   * @param {*} feedback - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async saveFeedback(feedback) {
    await this.executor.execute(
      `INSERT INTO workflow_feedback
       (feedback_id, workflow_id, actor_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [
        feedback.feedbackId,
        feedback.workflowId,
        feedback.actorId,
        feedback.rating,
        feedback.comment,
      ],
    );
    return feedback;
  }

  // --- Audit Methods ---
  /**
   * append - Asynchronously executes append.
   * @param {*} event - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async append(event) {
    const [previousRows] = await this.executor.execute(
      `SELECT entry_hash FROM audit_events
       WHERE correlation_id = ?
       ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [event.correlationId],
    );
    const previousHash = previousRows[0]?.entry_hash || null;
    const entryHash = crypto.createHash('sha256').update(stableSerialize({
      ...event,
      previousHash,
    })).digest('hex');

    await this.executor.execute(
      `INSERT INTO audit_events (
        audit_id, occurred_at, correlation_id, event_id, workflow_id,
        action_id, approval_id, actor_type, actor_id, audit_type,
        from_state, to_state, outcome, policy_version, details,
        previous_hash, entry_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.auditId,
        event.occurredAt,
        event.correlationId,
        event.eventId || null,
        event.workflowId || null,
        event.actionId || null,
        event.approvalId || null,
        event.actorType,
        event.actorId,
        event.auditType,
        event.fromState || null,
        event.toState || null,
        event.outcome,
        event.policyVersion || null,
        JSON.stringify(event.details || {}),
        previousHash,
        entryHash,
      ],
    );

    return Object.freeze({
      auditId: event.auditId,
      previousHash,
      entryHash,
    });
  }

  // --- Decision Journal Methods ---
  /**
   * createDecision - Asynchronously executes create decision.
   * @param {*} entry - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async createDecision(entry) {
    await this.executor.execute(
      `INSERT INTO decision_journal (
         decision_id, workflow_id, goal_id, approval_id, actor_id,
         decision_type, decision, rationale, input_snapshot, input_hash,
         policy_version, expected_outcome, decided_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.decisionId,
        entry.workflowId,
        entry.goalId,
        entry.approvalId,
        entry.actorId,
        entry.decisionType,
        entry.decision,
        entry.rationale,
        JSON.stringify(entry.inputSnapshot),
        entry.inputHash,
        entry.policyVersion,
        entry.expectedOutcome ? JSON.stringify(entry.expectedOutcome) : null,
        entry.decidedAt,
      ],
    );
    return entry;
  }

  /**
   * recordOutcome - Asynchronously executes record outcome.
   * @param {*} decisionId - Input parameter.
   * @param {*} outcome - Input parameter.
   * @param {*} status - Input parameter.
   * @param {*} reviewedAt - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async recordOutcome(decisionId, outcome, status, reviewedAt) {
    const [result] = await this.executor.execute(
      `UPDATE decision_journal
       SET actual_outcome = ?, outcome_status = ?, reviewed_at = ?
       WHERE decision_id = ? AND outcome_status = 'pending'`,
      [JSON.stringify(outcome), status, reviewedAt, decisionId],
    );
    return result.affectedRows === 1;
  }

  // --- Outbox Methods ---
  /**
   * enqueue - Asynchronously executes enqueue.
   * @param {*} job - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async enqueue(job) {
    await this.executor.execute(
      `INSERT INTO outbox_jobs (
        job_id, job_key, job_type, workflow_id, action_id, correlation_id,
        payload, status, priority, max_attempts, available_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        job.jobId,
        job.jobKey,
        job.jobType,
        job.workflowId || null,
        job.actionId || null,
        job.correlationId,
        JSON.stringify(job.payload),
        job.priority ?? 50,
        job.maxAttempts ?? 3,
        job.availableAt,
      ],
    );
    return job;
  }

  /**
   * claimNext - Asynchronously executes claim next.
   * @param {*} workerId - Input parameter.
   * @param {*} now - Input parameter.
   * @param {*} leaseExpiresAt - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async claimNext(workerId, now, leaseExpiresAt) {
    const [rows] = await this.executor.execute(
      `SELECT * FROM outbox_jobs
       WHERE status IN ('pending', 'retry') AND available_at <= ?
         AND attempts < max_attempts
       ORDER BY priority DESC, available_at ASC, id ASC
       LIMIT 1 FOR UPDATE SKIP LOCKED`,
      [now],
    );
    const job = rows[0];
    if (!job) {
      return null;
    }

    await this.executor.execute(
      `UPDATE outbox_jobs
       SET status = 'processing', attempts = attempts + 1,
           leased_at = ?, lease_expires_at = ?, leased_by = ?
       WHERE job_id = ?`,
      [now, leaseExpiresAt, workerId, job.job_id],
    );

    return { ...job, status: 'processing', attempts: job.attempts + 1 };
  }

  /**
   * markDelivered - Asynchronously executes mark delivered.
   * @param {*} jobId - Input parameter.
   * @param {*} receipt - Input parameter.
   * @param {*} deliveredAt - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async markDelivered(jobId, receipt, deliveredAt) {
    await this.executor.execute(
      `UPDATE outbox_jobs
       SET status = 'delivered', delivered_at = ?, delivery_receipt = ?,
           lease_expires_at = NULL, leased_by = NULL
       WHERE job_id = ? AND status = 'processing'`,
      [deliveredAt, JSON.stringify(receipt || {}), jobId],
    );
  }

  /**
   * markRetry - Asynchronously executes mark retry.
   * @param {*} jobId - Input parameter.
   * @param {*} failure - Input parameter.
   * @param {*} availableAt - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async markRetry(jobId, failure, availableAt) {
    await this.executor.execute(
      `UPDATE outbox_jobs
       SET status = 'retry', available_at = ?, last_error_code = ?,
           last_error_message = ?, lease_expires_at = NULL, leased_by = NULL
       WHERE job_id = ? AND status = 'processing'`,
      [availableAt, failure.code, failure.message, jobId],
    );
  }

  /**
   * markDead - Asynchronously executes mark dead.
   * @param {*} jobId - Input parameter.
   * @param {*} failure - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async markDead(jobId, failure) {
    await this.executor.execute(
      `UPDATE outbox_jobs
       SET status = 'dead', last_error_code = ?, last_error_message = ?,
           lease_expires_at = NULL, leased_by = NULL
       WHERE job_id = ? AND status = 'processing'`,
      [failure.code, failure.message, jobId],
    );
  }

  /**
   * recoverExpiredLeases - Asynchronously executes recover expired leases.
   * @param {*} now - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async recoverExpiredLeases(now) {
    const [result] = await this.executor.execute(
      `UPDATE outbox_jobs
       SET status = 'retry', available_at = ?, leased_at = NULL,
           lease_expires_at = NULL, leased_by = NULL,
           last_error_code = 'worker_lease_expired'
       WHERE status = 'processing' AND lease_expires_at < ?`,
      [now, now],
    );
    return result.affectedRows;
  }
}

module.exports = OperatorRepository;
