'use strict';

/**
 * Initialize the learning database tables.
 * @param {import('../../models/Database')} db
 * @param {{ addColumnIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializeLearning(db, helpers) {
    // ─── 4-TABLE UNIFIED LEARNING HUB SCHEMA ─────────────────────────
    await db.query(`
      CREATE TABLE IF NOT EXISTS learning_category (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        slug        VARCHAR(64) NOT NULL UNIQUE,
        name        VARCHAR(128) NOT NULL,
        icon        VARCHAR(32) NOT NULL DEFAULT '📚',
        description TEXT NULL,
        sort_order  INT DEFAULT 0,
        is_active   TINYINT DEFAULT 1,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at  DATETIME NULL,
        INDEX idx_active (is_active, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS learning (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        type        VARCHAR(50) NOT NULL,
        slug        VARCHAR(64) NOT NULL UNIQUE,
        name        VARCHAR(128) NOT NULL,
        icon        VARCHAR(32) NOT NULL DEFAULT '📚',
        description TEXT NULL,
        topic_no    INT NULL,
        sort_order  INT DEFAULT 0,
        is_active   TINYINT DEFAULT 1,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at  DATETIME NULL,
        INDEX idx_cat_type (category_id, type),
        INDEX idx_active (is_active, sort_order),
        CONSTRAINT fk_learning_cat FOREIGN KEY (category_id) REFERENCES learning_category(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS learning_item (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        learning_id     INT NOT NULL,
        type            VARCHAR(50) NOT NULL,
        title           VARCHAR(255) NOT NULL,
        prompt          TEXT NULL,
        level           VARCHAR(50) DEFAULT 'medium',
        content         JSON NULL,
        sample_solution JSON NULL,
        tags            VARCHAR(255) NULL,
        is_sent         TINYINT DEFAULT 0,
        is_active       TINYINT DEFAULT 1,
        created_by      VARCHAR(50) DEFAULT 'ai',
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at      DATETIME NULL,
        INDEX idx_learning_id (learning_id),
        INDEX idx_type (type),
        INDEX idx_is_sent (is_sent),
        CONSTRAINT fk_learning_item_parent FOREIGN KEY (learning_id) REFERENCES learning(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS learning_meta_data (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        item_id          INT NOT NULL,
        username         VARCHAR(64) NOT NULL,
        meta_key         VARCHAR(64) NOT NULL DEFAULT 'progress',
        status           VARCHAR(50) DEFAULT 'unstudied',
        is_bookmarked    TINYINT DEFAULT 0,
        score            FLOAT NULL,
        user_submission  LONGTEXT NULL,
        ai_feedback      JSON NULL,
        last_activity_at DATETIME NULL,
        created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at       DATETIME NULL,
        UNIQUE KEY uniq_item_user_key (item_id, username, meta_key),
        INDEX idx_user_key (username, meta_key),
        CONSTRAINT fk_learning_meta_item FOREIGN KEY (item_id) REFERENCES learning_item(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS learning_delivery_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        legacy_id INT NULL UNIQUE,
        item_id INT NOT NULL,
        topic_no INT NULL,
        sent_date DATE NULL,
        sent_at DATETIME NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'sent',
        error TEXT NULL,
        channel_id VARCHAR(64) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        INDEX idx_delivery_item (item_id),
        CONSTRAINT fk_delivery_item FOREIGN KEY (item_id) REFERENCES learning_item(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS learning_quiz_result (
        id INT AUTO_INCREMENT PRIMARY KEY,
        legacy_id INT NULL UNIQUE,
        item_id INT NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        username VARCHAR(64) NOT NULL,
        quiz_type VARCHAR(32) NOT NULL,
        is_correct TINYINT(1) NOT NULL DEFAULT 0,
        score_delta INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        INDEX idx_quiz_item_user (item_id, username),
        INDEX idx_quiz_user_item (user_id, item_id, created_at),
        INDEX idx_quiz_created (created_at),
        CONSTRAINT fk_quiz_item FOREIGN KEY (item_id) REFERENCES learning_item(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await helpers.addIndexIfMissing(
      'learning_quiz_result',
      'idx_quiz_user_item',
      ['user_id', 'item_id', 'created_at']
    );
    await db.query('ALTER TABLE learning_delivery_log MODIFY legacy_id INT NULL');

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_quiz_stats (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        user_id          VARCHAR(64) NOT NULL UNIQUE,
        username         VARCHAR(128) NOT NULL,
        total_score      INT DEFAULT 0,
        correct_count    INT DEFAULT 0,
        wrong_count      INT DEFAULT 0,
        streak_days      INT DEFAULT 0,
        last_active_date DATE NULL,
        created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at       DATETIME NULL,
        INDEX idx_score (total_score DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);


};




