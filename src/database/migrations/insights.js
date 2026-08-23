'use strict';

/**
 * Initialize the insights database tables.
 * @param {import('../../models/Database')} db
 * @param {{ addColumnIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializeInsights(db, helpers) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS insights (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        user_id        VARCHAR(32)              NOT NULL,
        username       VARCHAR(128)             NOT NULL,
        platform       VARCHAR(16)              NOT NULL,
        channel_id     VARCHAR(64)              NOT NULL,
        query_type     ENUM('search','crawl')   NOT NULL,
        query          TEXT                     NOT NULL,
        result_preview TEXT,
        ai_summary     TEXT,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at     DATETIME NULL,
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);


};





