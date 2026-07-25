'use strict';

const OutboxRepository = require('../../../domain/repositories/outbox.repository');

class MysqlOutboxRepository extends OutboxRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

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

  async markDelivered(jobId, receipt, deliveredAt) {
    await this.executor.execute(
      `UPDATE outbox_jobs
       SET status = 'delivered', delivered_at = ?, delivery_receipt = ?,
           lease_expires_at = NULL, leased_by = NULL
       WHERE job_id = ? AND status = 'processing'`,
      [deliveredAt, JSON.stringify(receipt || {}), jobId],
    );
  }

  async markRetry(jobId, failure, availableAt) {
    await this.executor.execute(
      `UPDATE outbox_jobs
       SET status = 'retry', available_at = ?, last_error_code = ?,
           last_error_message = ?, lease_expires_at = NULL, leased_by = NULL
       WHERE job_id = ? AND status = 'processing'`,
      [availableAt, failure.code, failure.message, jobId],
    );
  }

  async markDead(jobId, failure) {
    await this.executor.execute(
      `UPDATE outbox_jobs
       SET status = 'dead', last_error_code = ?, last_error_message = ?,
           lease_expires_at = NULL, leased_by = NULL
       WHERE job_id = ? AND status = 'processing'`,
      [failure.code, failure.message, jobId],
    );
  }

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

module.exports = MysqlOutboxRepository;
