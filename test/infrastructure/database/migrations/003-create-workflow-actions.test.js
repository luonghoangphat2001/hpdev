'use strict';

const migration = require('@database/migrations/003-create-workflow-actions');

describe('003-create-workflow-actions migration', () => {
  it('creates a reversible action store owned by a workflow', () => {
    expect(migration.id).toBe('003-create-workflow-actions');
    expect(migration.up).toContain('CREATE TABLE workflow_actions');
    expect(migration.up).toContain('REFERENCES workflows (workflow_id)');
    expect(migration.down).toBe('DROP TABLE IF EXISTS workflow_actions;');
  });

  it('persists exact request identity and optimistic resource version', () => {
    expect(migration.up).toContain('request_payload JSON NOT NULL');
    expect(migration.up).toContain('payload_hash CHAR(64) NOT NULL');
    expect(migration.up).toContain('idempotency_key VARCHAR(160) NOT NULL');
    expect(migration.up).toContain('expected_resource_version VARCHAR(128) NULL');
  });

  it('prevents duplicate execution and duplicate sequence positions', () => {
    expect(migration.up).toContain('UNIQUE KEY uq_workflow_actions_action_id');
    expect(migration.up).toContain('UNIQUE KEY uq_workflow_actions_idempotency_key');
    expect(migration.up).toContain('UNIQUE KEY uq_workflow_actions_sequence');
  });

  it('tracks retry state, SSOT receipt and failures', () => {
    expect(migration.up).toContain('retry_count INT UNSIGNED NOT NULL DEFAULT 0');
    expect(migration.up).toContain('ssot_receipt JSON NULL');
    expect(migration.up).toContain('receipt_hash CHAR(64) NULL');
    expect(migration.up).toContain('last_error_code VARCHAR(128) NULL');
  });

  it('has no direct relationship to Ecommerce business tables', () => {
    expect(migration.up).not.toMatch(/shop_orders|shop_products|departments/i);
  });
});
