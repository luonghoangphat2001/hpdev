'use strict';

const migration = require('@database/migrations/007-create-dead-letters');

describe('007-create-dead-letters migration', () => {
  it('creates a reversible dead-letter store', () => {
    expect(migration.id).toBe('007-create-dead-letters');
    expect(migration.up).toContain('CREATE TABLE dead_letters');
    expect(migration.down).toBe('DROP TABLE IF EXISTS dead_letters;');
  });

  it('preserves failed payload evidence and retry history', () => {
    [
      'payload_snapshot JSON NOT NULL',
      'payload_hash CHAR(64) NOT NULL',
      'attempt_count INT UNSIGNED NOT NULL',
      'first_failed_at DATETIME(3) NOT NULL',
      'last_failed_at DATETIME(3) NOT NULL',
    ].forEach((definition) => expect(migration.up).toContain(definition));
  });

  it('deduplicates the same terminal failure', () => {
    expect(migration.up).toContain(
      'UNIQUE KEY uq_dead_letters_failure',
    );
    expect(migration.up).toContain('(source_type, source_id, payload_hash)');
  });

  it('supports manual resolution and safe replay linkage', () => {
    expect(migration.up).toContain('resolution VARCHAR(2000) NULL');
    expect(migration.up).toContain('resolved_by VARCHAR(128) NULL');
    expect(migration.up).toContain('resolved_at DATETIME(3) NULL');
    expect(migration.up).toContain('replay_job_id VARCHAR(128) NULL');
  });

  it('indexes operator inbox and error triage queries', () => {
    expect(migration.up).toContain('idx_dead_letters_inbox (status, last_failed_at)');
    expect(migration.up).toContain(
      'idx_dead_letters_error (error_code, status, last_failed_at)',
    );
  });
});
