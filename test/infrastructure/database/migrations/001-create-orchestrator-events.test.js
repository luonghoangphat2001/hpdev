'use strict';

const migration = require('@database/migrations/001-create-orchestrator-events');

describe('001-create-orchestrator-events migration', () => {
  it('has stable migration identity and reversible SQL', () => {
    expect(migration.id).toBe('001-create-orchestrator-events');
    expect(migration.up).toContain('CREATE TABLE orchestrator_events');
    expect(migration.down).toBe('DROP TABLE IF EXISTS orchestrator_events;');
  });

  it('deduplicates canonical events and webhook deliveries', () => {
    expect(migration.up).toContain('UNIQUE KEY uq_orchestrator_events_event_id (event_id)');
    expect(migration.up).toContain('UNIQUE KEY uq_orchestrator_events_delivery_id (delivery_id)');
  });

  it('stores raw evidence and signature verification outcome', () => {
    [
      'raw_payload JSON NOT NULL',
      'payload_hash CHAR(64) NOT NULL',
      'signature_valid TINYINT(1) NOT NULL',
      'signature_key_id VARCHAR(128) NULL',
    ].forEach((definition) => expect(migration.up).toContain(definition));
  });

  it('supports retry, correlation and operational queries', () => {
    expect(migration.up).toContain('processing_attempts INT UNSIGNED');
    expect(migration.up).toContain('last_error_code VARCHAR(128)');
    expect(migration.up).toContain('idx_orchestrator_events_status_received');
    expect(migration.up).toContain('idx_orchestrator_events_correlation_id');
  });

  it('does not couple the orchestrator database to Ecommerce tables', () => {
    expect(migration.up).not.toMatch(/FOREIGN KEY/i);
    expect(migration.up).not.toMatch(/shop_orders|shop_products|departments/i);
  });
});
