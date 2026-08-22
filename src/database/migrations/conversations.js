'use strict';

/**
 * Initialize the conversations database tables.
 * @param {import('../../models/Database')} db
 * @param {{ addColumnIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializeConversations(db, helpers) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id VARCHAR(32) NOT NULL,
        user_id VARCHAR(32) NOT NULL,
        username VARCHAR(64) NOT NULL,
        role VARCHAR(16) NOT NULL,
        content TEXT NOT NULL,
        model VARCHAR(32),
        tokens_in INT NOT NULL DEFAULT 0,
        tokens_out INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_channel (channel_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Migration: add token columns to existing tables
    await helpers.addColumnIfMissing('conversations', 'tokens_in',  'INT NOT NULL DEFAULT 0');
    await helpers.addColumnIfMissing('conversations', 'tokens_out', 'INT NOT NULL DEFAULT 0');

    // Migration: widen model column so full model names fit
    await helpers.widenColumnIfNeeded('conversations', 'model', 'VARCHAR(64)', 32);


};





