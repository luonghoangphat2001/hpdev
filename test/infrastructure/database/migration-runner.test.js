'use strict';

const crypto = require('crypto');
const MigrationRunner = require('../../../src/database/migration-runner');

function connectionWithApplied(applied = []) {
  const connection = {
    query: jest.fn()
      .mockResolvedValueOnce([[{ acquired: 1 }]])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([applied])
      .mockResolvedValue([]),
    release: jest.fn(),
  };
  return connection;
}

describe('MigrationRunner', () => {
  const migration = {
    id: '001-test',
    up: 'CREATE TABLE test_one (id INT); CREATE INDEX idx_test ON test_one (id);',
    down: 'DROP TABLE test_one;',
  };

  test('serializes runners, executes statements in order, and records checksum', async () => {
    const connection = connectionWithApplied();
    const pool = { getConnection: jest.fn().mockResolvedValue(connection) };
    const runner = new MigrationRunner({ pool, migrationList: [migration] });

    await expect(runner.run()).resolves.toEqual({ executed: ['001-test'] });

    const sqlCalls = connection.query.mock.calls.map(([sql]) => sql.trim());
    expect(sqlCalls).toEqual(expect.arrayContaining([
      'SELECT GET_LOCK(?, 30) AS acquired',
      'CREATE TABLE test_one (id INT)',
      'CREATE INDEX idx_test ON test_one (id)',
      'INSERT INTO schema_migrations (migration_id, checksum) VALUES (?, ?)',
      'SELECT RELEASE_LOCK(?)',
    ]));
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test('refuses a modified migration that was already applied', async () => {
    const checksum = crypto.createHash('sha256')
      .update('different sql')
      .digest('hex');
    const connection = connectionWithApplied([
      { migration_id: '001-test', checksum },
    ]);
    const pool = { getConnection: jest.fn().mockResolvedValue(connection) };

    await expect(new MigrationRunner({ pool, migrationList: [migration] }).run())
      .rejects.toThrow('Migration checksum mismatch: 001-test');
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
});
