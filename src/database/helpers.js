'use strict';

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

module.exports = function createMigrationHelpers(db) {
  return {
    addColumnIfMissing: (...args) => addColumnIfMissing(db, ...args),
    addIndexIfMissing: (...args) => addIndexIfMissing(db, ...args),
    widenColumnIfNeeded: (...args) => widenColumnIfNeeded(db, ...args),
  };
};

async function addIndexIfMissing(db, table, index, columns) {
  assertIdentifier(table, 'table');
  assertIdentifier(index, 'index');
  const safeColumns = (columns || []).map((column) => {
    assertIdentifier(column, 'column');
    return `\`${column}\``;
  });
  if (!safeColumns.length) throw new Error('Index requires at least one column');

  const dbName = process.env.DB_NAME || 'dan_ai';
  const exists = await db.queryOne(
    'SELECT 1 FROM information_schema.STATISTICS WHERE (TABLE_SCHEMA = ? OR TABLE_SCHEMA = DATABASE()) AND TABLE_NAME = ? AND INDEX_NAME = ?',
    [dbName, table, index]
  );
  if (!exists) {
    await db.query(`ALTER TABLE \`${table}\` ADD INDEX \`${index}\` (${safeColumns.join(', ')})`);
  }
}

async function addColumnIfMissing(db, table, column, definition) {
  assertIdentifier(table, 'table');
  assertIdentifier(column, 'column');

  const dbName = process.env.DB_NAME || 'dan_ai';
  const exists = await db.queryOne(
    'SELECT 1 FROM information_schema.COLUMNS WHERE (TABLE_SCHEMA = ? OR TABLE_SCHEMA = DATABASE()) AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [dbName, table, column]
  );

  if (!exists) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function widenColumnIfNeeded(db, table, column, newType, maxOldLen) {
  assertIdentifier(table, 'table');
  assertIdentifier(column, 'column');

  const dbName = process.env.DB_NAME;
  const row = await db.queryOne(
    'SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [dbName, table, column]
  );

  if (row && Number(row.CHARACTER_MAXIMUM_LENGTH) <= maxOldLen) {
    await db.query(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${newType}`);
  }
}

function assertIdentifier(value, type) {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`Invalid SQL ${type}: ${value}`);
  }
}
