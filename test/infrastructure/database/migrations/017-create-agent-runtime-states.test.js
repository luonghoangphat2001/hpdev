'use strict';

const migration =
  require('@database/migrations/017-create-agent-runtime-states');

describe('T143 supplemental: agent runtime state migration', () => {
  test('persists versioned lifecycle state for exactly the five registered agents', () => {
    expect(migration.id).toBe('017-create-agent-runtime-states');
    expect(migration.up).toContain('CREATE TABLE agent_runtime_states');
    expect(migration.up).toContain('state_version INT UNSIGNED NOT NULL DEFAULT 1');
    expect(migration.up).toContain("'QUARANTINED'");
    ['dan_rnd', 'dan_logistics', 'dan_cfo', 'dan_ops', 'dan_cskh']
      .forEach((agentId) => expect(migration.up).toContain(`'${agentId}'`));
    expect(migration.down).toContain('DROP TABLE IF EXISTS agent_runtime_states');
  });
});
