'use strict';

const migration =
  require('../../../../src/infrastructure/database/migrations/014-create-decision-journal');

describe('014-create-decision-journal migration', () => {
  test('stores decision rationale, evidence snapshot, policy and eventual outcome', () => {
    expect(migration.up).toContain('CREATE TABLE decision_journal');
    expect(migration.up).toContain('rationale VARCHAR(2000) NOT NULL');
    expect(migration.up).toContain('input_snapshot JSON NOT NULL');
    expect(migration.up).toContain('policy_version');
    expect(migration.up).toContain('actual_outcome JSON');
  });
});
