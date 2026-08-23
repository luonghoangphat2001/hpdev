'use strict';

/**
 * Initialize the schedules database tables.
 * @param {import('../../models/Database')} db
 * @param {{ addColumnIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializeSchedules(db, helpers) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     VARCHAR(32)  NOT NULL,
        username    VARCHAR(64),
        platform    VARCHAR(16)  DEFAULT 'discord',
        channel_id  VARCHAR(32),
        title       VARCHAR(255) NOT NULL,
        remind_at   DATETIME     NOT NULL COMMENT 'next fire time',
        repeat_type ENUM('none','daily','weekly') DEFAULT 'none',
        is_active   TINYINT      DEFAULT 1,
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at  DATETIME     NULL,
        INDEX idx_remind (remind_at, is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await helpers.addColumnIfMissing('schedules', 'notified_1h',  'TINYINT DEFAULT 0');
    await helpers.addColumnIfMissing('schedules', 'notified_30m', 'TINYINT DEFAULT 0');


};





