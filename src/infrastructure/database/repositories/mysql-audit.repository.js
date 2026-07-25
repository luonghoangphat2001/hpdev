'use strict';

const crypto = require('crypto');
const AuditRepository = require('../../../domain/repositories/audit.repository');
const { stableSerialize } = require('../../../contracts/identity/correlation-convention');

class MysqlAuditRepository extends AuditRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

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
}

module.exports = MysqlAuditRepository;
