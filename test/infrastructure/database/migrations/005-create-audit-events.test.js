'use strict';

const migration = require('../../../../src/infrastructure/database/migrations/005-create-audit-events');

describe('005-create-audit-events migration', () => {
  it('creates a reversible audit store', () => {
    expect(migration.id).toBe('005-create-audit-events');
    expect(migration.up).toContain('CREATE TABLE audit_events');
    expect(migration.down).toContain('DROP TABLE IF EXISTS audit_events');
  });

  it('correlates every orchestration entity without business-table coupling', () => {
    ['event_id', 'workflow_id', 'action_id', 'approval_id', 'correlation_id']
      .forEach((field) => expect(migration.up).toContain(`${field} VARCHAR(128)`));
    expect(migration.up).not.toMatch(/shop_orders|shop_products|departments/i);
  });

  it('captures actor, transition, outcome, policy and structured details', () => {
    [
      'actor_type VARCHAR(64) NOT NULL',
      'actor_id VARCHAR(128) NOT NULL',
      'from_state VARCHAR(64) NULL',
      'to_state VARCHAR(64) NULL',
      'outcome VARCHAR(32) NOT NULL',
      'policy_version VARCHAR(32) NULL',
      'details JSON NOT NULL',
    ].forEach((definition) => expect(migration.up).toContain(definition));
  });

  it('supports tamper-evident hash chaining', () => {
    expect(migration.up).toContain('previous_hash CHAR(64) NULL');
    expect(migration.up).toContain('entry_hash CHAR(64) NOT NULL');
    expect(migration.up).toContain('UNIQUE KEY uq_audit_events_entry_hash');
  });

  it('blocks updates and deletes at database level', () => {
    expect(migration.up).toContain('CREATE TRIGGER audit_events_block_update');
    expect(migration.up).toContain('CREATE TRIGGER audit_events_block_delete');
    expect(migration.up.match(/append-only/g)).toHaveLength(2);
  });
});
