'use strict';

const migration = require('@database/migrations/008-create-agent-memories');

describe('008-create-agent-memories migration', () => {
  test('creates scoped, expiring, uniquely keyed agent memory', () => {
    expect(migration.up).toContain('CREATE TABLE agent_memories');
    expect(migration.up).toContain('scope_type');
    expect(migration.up).toContain('expires_at DATETIME(3) NOT NULL');
    expect(migration.up).toContain('uq_agent_memories_scope_key');
    expect(migration.down).toBe('DROP TABLE IF EXISTS agent_memories;');
  });
});
