'use strict';

const migration = require('../../../../src/infrastructure/database/migrations/009-add-operator-control');

describe('009-add-operator-control migration', () => {
  test('adds resumable workflow state and bounded feedback', () => {
    expect(migration.up).toContain('paused_from_state');
    expect(migration.up).toContain('CREATE TABLE workflow_feedback');
    expect(migration.up).toContain('CHECK (rating BETWEEN 1 AND 5)');
  });
});
