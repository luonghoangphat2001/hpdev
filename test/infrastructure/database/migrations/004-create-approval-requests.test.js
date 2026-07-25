'use strict';

const migration = require('../../../../src/infrastructure/database/migrations/004-create-approval-requests');

describe('004-create-approval-requests migration', () => {
  it('creates a reversible approval store linked to workflow and action', () => {
    expect(migration.id).toBe('004-create-approval-requests');
    expect(migration.up).toContain('CREATE TABLE approval_requests');
    expect(migration.up).toContain('REFERENCES workflows (workflow_id)');
    expect(migration.up).toContain('REFERENCES workflow_actions (action_id)');
    expect(migration.down).toBe('DROP TABLE IF EXISTS approval_requests;');
  });

  it('pins approval to an immutable payload snapshot and hash', () => {
    expect(migration.up).toContain('payload_hash CHAR(64) NOT NULL');
    expect(migration.up).toContain('request_snapshot JSON NOT NULL');
  });

  it('stores expiry, approver and complete decision details', () => {
    expect(migration.up).toContain('expires_at DATETIME(3) NOT NULL');
    expect(migration.up).toContain('decided_by VARCHAR(128) NULL');
    expect(migration.up).toContain('decision_reason VARCHAR(2000) NULL');
    expect(migration.up).toContain('decided_at DATETIME(3) NULL');
  });

  it('supports atomic single consumption using status and decision version', () => {
    expect(migration.up).toContain('status VARCHAR(32) NOT NULL DEFAULT');
    expect(migration.up).toContain('decision_version INT UNSIGNED NOT NULL DEFAULT 1');
    expect(migration.up).toContain('consumed_at DATETIME(3) NULL');
    expect(migration.up).toContain('consumed_by VARCHAR(128) NULL');
  });

  it('indexes the CEO pending approval inbox', () => {
    expect(migration.up).toContain(
      'idx_approval_requests_inbox (status, expires_at, requested_at)',
    );
  });
});
