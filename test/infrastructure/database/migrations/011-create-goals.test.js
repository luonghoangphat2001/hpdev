'use strict';

const migration = require('../../../../src/infrastructure/database/migrations/011-create-goals');

describe('011-create-goals migration', () => {
  test('stores hierarchical goal horizon, owner, target, deadline and status', () => {
    expect(migration.up).toContain('CREATE TABLE goals');
    expect(migration.up).toContain('parent_goal_id');
    expect(migration.up).toContain("horizon IN ('year', 'quarter', 'month', 'week')");
    expect(migration.up).toContain('target JSON NOT NULL');
    expect(migration.up).toContain('deadline_at DATETIME(3) NOT NULL');
  });
});
