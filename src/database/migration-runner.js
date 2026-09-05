/**
 * @fileoverview migration-runner - Provides migration-runner functionality.
 */
'use strict';

const crypto = require('crypto');
const migrations = require('@database/migrations');

/**
 * MigrationRunner
 * Manages migration runner logic.
 */
class MigrationRunner {
  constructor({
    pool,
    migrationList = migrations,
    lockName = 'openclaw_orchestrator_migrations',
  }) {
    this.pool = pool;
    this.migrations = migrationList;
    this.lockName = lockName;
    this.#validate();
  }

  /**
   * run - Asynchronously executes run.
   * @returns {*} Promise resolving result.
   */
  async run() {
    const connection = await this.pool.getConnection();
    let lockHeld = false;
    try {
      const [lockRows] = await connection.query('SELECT GET_LOCK(?, 30) AS acquired', [this.lockName]);
      lockHeld = Number(lockRows[0]?.acquired) === 1;
      if (!lockHeld) throw new Error('Could not acquire migration lock');

      await connection.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          migration_id VARCHAR(160) NOT NULL PRIMARY KEY,
          checksum CHAR(64) NOT NULL,
          applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      const [rows] = await connection.query(
        'SELECT migration_id, checksum FROM schema_migrations'
      );
      const applied = new Map(rows.map((row) => [row.migration_id, row.checksum]));
      const executed = [];

      for (const migration of this.migrations) {
        const checksum = this.#checksum(migration.up);
        if (applied.has(migration.id)) {
          if (applied.get(migration.id) !== checksum) {
            throw new Error(`Migration checksum mismatch: ${migration.id} (applied="${applied.get(migration.id)}", calculated="${checksum}")`);
          }
          continue;
        }

        for (const statement of this.#statements(migration.up)) {
          await connection.query(statement);
        }
        await connection.query(
          'INSERT INTO schema_migrations (migration_id, checksum) VALUES (?, ?)',
          [migration.id, checksum]
        );
        executed.push(migration.id);
      }
      return Object.freeze({ executed: Object.freeze(executed) });
    } finally {
      if (lockHeld) {
        await connection.query('SELECT RELEASE_LOCK(?)', [this.lockName])
          .catch(() => {});
      }
      connection.release();
    }
  }

  #checksum(sql) {
    return crypto.createHash('sha256').update(sql.replace(/\r\n/g, '\n').trim()).digest('hex');
  }

  #statements(sql) {
    return sql.split(';').map((statement) => statement.trim()).filter(Boolean);
  }

  #validate() {
    const ids = this.migrations.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      throw new TypeError('Migration IDs must be unique');
    }
    this.migrations.forEach((migration) => {
      if (!migration.id || !migration.up || !migration.down) {
        throw new TypeError('Each migration requires id, up, and down');
      }
    });
  }
}

module.exports = MigrationRunner;
