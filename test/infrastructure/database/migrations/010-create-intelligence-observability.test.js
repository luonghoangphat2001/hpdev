'use strict';

const migration =
  require('../../../../src/database/migrations/010-create-intelligence-observability');

describe('010-create-intelligence-observability migration', () => {
  test('stores stage traces and creates a reviewable feedback queue', () => {
    expect(migration.up).toContain('CREATE TABLE intelligence_traces');
    expect(migration.up).toContain("stage IN ('planner', 'agent', 'model', 'tool')");
    expect(migration.up).toContain('cost_usd DECIMAL(12,6)');
    expect(migration.up).toContain('review_status');
    expect(migration.up).toContain('idx_workflow_feedback_queue');
  });
});
