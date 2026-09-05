'use strict';

const migration = require('@database/migrations/006-create-outbox-jobs');

describe('006-create-outbox-jobs migration', () => {
  it('creates a reversible transactional outbox', () => {
    expect(migration.id).toBe('006-create-outbox-jobs');
    expect(migration.up).toContain('CREATE TABLE outbox_jobs');
    expect(migration.down).toBe('DROP TABLE IF EXISTS outbox_jobs;');
  });

  it('deduplicates jobs by public ID and semantic job key', () => {
    expect(migration.up).toContain('UNIQUE KEY uq_outbox_jobs_job_id');
    expect(migration.up).toContain('UNIQUE KEY uq_outbox_jobs_job_key');
  });

  it('tracks attempts, scheduling, lease and delivery result', () => {
    [
      'attempts INT UNSIGNED NOT NULL DEFAULT 0',
      'available_at DATETIME(3) NOT NULL',
      'lease_expires_at DATETIME(3) NULL',
      'leased_by VARCHAR(128) NULL',
      'delivery_receipt JSON NULL',
    ].forEach((definition) => expect(migration.up).toContain(definition));
  });

  it('supports atomic claim and abandoned lease recovery queries', () => {
    expect(migration.up).toContain(
      'idx_outbox_jobs_claim (status, available_at, priority)',
    );
    expect(migration.up).toContain(
      'idx_outbox_jobs_lease_recovery (status, lease_expires_at)',
    );
  });

  it('links only to internal workflow and action records', () => {
    expect(migration.up).toContain('REFERENCES workflows (workflow_id)');
    expect(migration.up).toContain('REFERENCES workflow_actions (action_id)');
    expect(migration.up).not.toMatch(/shop_orders|shop_products|departments/i);
  });
});
