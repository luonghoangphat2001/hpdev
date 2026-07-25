'use strict';

const DeadLetterRepository = require('../../../domain/repositories/dead-letter.repository');

class MysqlDeadLetterRepository extends DeadLetterRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

  async create(item) {
    await this.executor.execute(
      `INSERT INTO dead_letters (
        dead_letter_id, source_type, source_id, event_id, workflow_id,
        action_id, correlation_id, payload_snapshot, payload_hash,
        error_code, error_class, error_message, error_details, attempt_count,
        first_failed_at, last_failed_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
      ON DUPLICATE KEY UPDATE
        attempt_count = VALUES(attempt_count),
        last_failed_at = VALUES(last_failed_at),
        error_code = VALUES(error_code),
        error_message = VALUES(error_message)`,
      [
        item.deadLetterId,
        item.sourceType,
        item.sourceId,
        item.eventId || null,
        item.workflowId || null,
        item.actionId || null,
        item.correlationId,
        JSON.stringify(item.payloadSnapshot),
        item.payloadHash,
        item.errorCode,
        item.errorClass || null,
        item.errorMessage,
        JSON.stringify(item.errorDetails || {}),
        item.attemptCount,
        item.firstFailedAt,
        item.lastFailedAt,
      ],
    );
    return item;
  }
}

module.exports = MysqlDeadLetterRepository;
