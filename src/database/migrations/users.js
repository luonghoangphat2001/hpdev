'use strict';

/**
 * Initialize the users database table (Pure DDL).
 * @param {import('../../models/Database')} db
 * @param {{ addColumnIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializeUsers(db, helpers) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','user') NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await helpers.addColumnIfMissing('users', 'last_active', 'DATETIME NULL');
};
