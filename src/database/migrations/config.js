'use strict';

/**
 * Initialize the system config database table (Pure DDL).
 * @param {import('../../models/Database')} db
 */
module.exports = async function initializeConfig(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS config (
      \`key\` VARCHAR(64) PRIMARY KEY,
      value TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};
