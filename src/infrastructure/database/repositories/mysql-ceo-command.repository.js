'use strict';

class MysqlCeoCommandRepository {
  constructor(executor) {
    this.executor = executor;
  }

  async findByIdempotencyKey(key) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM ceo_command_requests WHERE idempotency_key = ? LIMIT 1',
      [key],
    );
    return rows[0] || null;
  }

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

  async complete(requestId, result, completedAt) {
    const status = result?.status === 'queued' ? 'queued' : 'completed';
    await this.executor.execute(
      `UPDATE ceo_command_requests
       SET status = ?, result = ?, completed_at = ?
       WHERE request_id = ? AND status = 'processing'`,
      [status, JSON.stringify(result || {}), completedAt, requestId],
    );
  }

  async fail(requestId, errorCode, completedAt) {
    await this.executor.execute(
      `UPDATE ceo_command_requests
       SET status = 'failed', error_code = ?, completed_at = ?
       WHERE request_id = ? AND status = 'processing'`,
      [errorCode, completedAt, requestId],
    );
  }
}

module.exports = MysqlCeoCommandRepository;
