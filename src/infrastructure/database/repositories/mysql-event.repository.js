'use strict';

const EventRepository = require('../../../domain/repositories/event.repository');

class MysqlEventRepository extends EventRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

  async create(event) {
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

  async findByEventId(eventId) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM orchestrator_events WHERE event_id = ? LIMIT 1',
      [eventId],
    );
    return rows[0] || null;
  }

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
}

module.exports = MysqlEventRepository;
