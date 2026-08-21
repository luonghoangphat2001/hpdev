'use strict';

const migration =
  require('../../../../src/database/migrations/013-create-ceo-exceptions');

describe('013-create-ceo-exceptions migration', () => {
  test('creates a normalized and deduplicated CEO exception queue', () => {
    expect(migration.up).toContain('CREATE TABLE ceo_exceptions');
    expect(migration.up).toContain('uq_ceo_exceptions_source');
    expect(migration.up).toContain(
      "source_type IN ('approval', 'dead_letter', 'conflict', 'kpi_deviation')"
    );
    expect(migration.up).toContain('idx_ceo_exceptions_inbox');
  });
});
