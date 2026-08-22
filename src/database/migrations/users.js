'use strict';

/**
 * Initialize the users database tables.
 * @param {import('../../models/Database')} db
 * @param {{ addColumnIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializeUsers(db, helpers) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS config (
        \`key\` VARCHAR(64) PRIMARY KEY,
        value TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

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

    // Auto-seed default admin if table is empty
    const rows = await db.query('SELECT COUNT(*) AS total FROM users');
    const total = rows[0]?.total ?? 0;
    if (Number(total) === 0) {
      const bcrypt = require('bcryptjs');
      const defaultHash = bcrypt.hashSync('Luonghoangphat12001@', 10);
      await db.query(
        "INSERT INTO users (username, password_hash, role) VALUES ('admin', ?, 'admin')",
        [defaultHash]
      );
      console.log('[Database] Seeded default admin user (username: admin)');
    }
};






