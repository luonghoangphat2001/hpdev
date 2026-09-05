'use strict';

const migration =
  require('@database/migrations/015-create-agent-autonomy-settings');

describe('015-create-agent-autonomy-settings migration', () => {
  test('stores one versioned, pausable autonomy policy per agent', () => {
    expect(migration.up).toContain('CREATE TABLE agent_autonomy_settings');
    expect(migration.up).toContain("'OBSERVE', 'PROPOSE', 'EXECUTE_LOW_RISK', 'FULL_WITH_LIMITS'");
    expect(migration.up).toContain('limits JSON NOT NULL');
    expect(migration.up).toContain('enabled TINYINT(1)');
  });
});
