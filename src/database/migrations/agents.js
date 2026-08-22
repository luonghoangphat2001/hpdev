'use strict';

/**
 * Initialize the agents database tables.
 * @param {import('../../models/Database')} db
 * @param {{ addColumnIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializeAgents(db, helpers) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_memories (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    VARCHAR(64)  NOT NULL,
        platform   VARCHAR(16)  NOT NULL,
        channel_id VARCHAR(64)  NOT NULL,
        mem_key    VARCHAR(255) NOT NULL,
        mem_value  TEXT         NOT NULL,
        source     VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_key (user_id, platform, mem_key),
        INDEX idx_user (user_id, platform)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        user_id      VARCHAR(64)  NOT NULL,
        username     VARCHAR(128) NOT NULL,
        platform     VARCHAR(16)  NOT NULL,
        channel_id   VARCHAR(64)  NOT NULL,
        description  TEXT         NOT NULL,
        status       ENUM('pending','running','done','failed') DEFAULT 'pending',
        result       MEDIUMTEXT,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        INDEX idx_channel (channel_id),
        INDEX idx_status  (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);


};





