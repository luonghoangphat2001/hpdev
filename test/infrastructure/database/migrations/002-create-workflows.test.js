'use strict';

const migration = require('@database/migrations/002-create-workflows');

describe('002-create-workflows migration', () => {
  it('creates a reversible workflow store', () => {
    expect(migration.id).toBe('002-create-workflows');
    expect(migration.up).toContain('CREATE TABLE workflows');
    expect(migration.down).toBe('DROP TABLE IF EXISTS workflows;');
  });

  it('stores state, optimistic version, agent and risk', () => {
    expect(migration.up).toContain('state VARCHAR(32) NOT NULL');
    expect(migration.up).toContain('state_version INT UNSIGNED NOT NULL DEFAULT 1');
    expect(migration.up).toContain('assigned_agent_id VARCHAR(128) NULL');
    expect(migration.up).toContain('risk_level VARCHAR(16) NOT NULL');
  });

  it('stores lifecycle timestamps and explicit failure details', () => {
    ['queued_at', 'started_at', 'completed_at', 'deadline_at'].forEach((field) => {
      expect(migration.up).toContain(`${field} DATETIME(3) NULL`);
    });
    expect(migration.up).toContain('failure_code VARCHAR(128) NULL');
    expect(migration.up).toContain('failure_reason VARCHAR(2000) NULL');
  });

  it('supports atomic queue and optimistic-lock queries', () => {
    expect(migration.up).toContain('UNIQUE KEY uq_workflows_workflow_id');
    expect(migration.up).toContain('idx_workflows_queue (state, priority, queued_at)');
    expect(migration.up).toContain('idx_workflows_agent_state');
  });

  it('references only the internal orchestrator event store', () => {
    expect(migration.up).toContain('REFERENCES orchestrator_events (event_id)');
    expect(migration.up).not.toMatch(/shop_orders|shop_products|departments/i);
  });
});
