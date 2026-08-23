'use strict';

/**
 * Initialize the notifications database tables.
 * @param {import('../../models/Database')} db
 * @param {{ addColumnIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializeNotifications(db, helpers) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS discord_notification_outbox (
        id              BIGINT AUTO_INCREMENT PRIMARY KEY,
        idempotency_key VARCHAR(128) NOT NULL UNIQUE,
        source          VARCHAR(64) NOT NULL DEFAULT 'openclaw',
        severity        ENUM('info','success','warning','critical') NOT NULL DEFAULT 'info',
        title           VARCHAR(255) NOT NULL,
        message         TEXT NOT NULL,
        channel_id      VARCHAR(64),
        status          ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
        attempt_count   INT NOT NULL DEFAULT 0,
        last_error      VARCHAR(500),
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at      DATETIME NULL,
        sent_at         DATETIME,
        INDEX idx_delivery (status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);


};





