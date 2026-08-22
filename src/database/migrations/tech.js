'use strict';

/**
 * Initialize the tech database tables.
 * @param {import('../../models/Database')} db
 * @param {{ addColumnIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializeTech(db, helpers) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tech_stacks (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        slug        VARCHAR(64) NOT NULL UNIQUE,
        name        VARCHAR(128) NOT NULL,
        icon        VARCHAR(32) NOT NULL DEFAULT '💻',
        description TEXT,
        sort_order  INT DEFAULT 0,
        is_active   TINYINT DEFAULT 1,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS tech_topics (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        stack_id    INT NOT NULL,
        slug        VARCHAR(64) NULL,
        name        VARCHAR(128) NULL,
        topic_name  VARCHAR(128) NULL,
        description TEXT,
        sort_order  INT DEFAULT 0,
        is_active   TINYINT DEFAULT 1,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (stack_id) REFERENCES tech_stacks(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await helpers.addColumnIfMissing('tech_topics', 'slug', 'VARCHAR(64) NULL');
    await helpers.addColumnIfMissing('tech_topics', 'name', 'VARCHAR(128) NULL');
    await helpers.addColumnIfMissing('tech_topics', 'topic_name', 'VARCHAR(128) NULL');


    await db.query(`
      CREATE TABLE IF NOT EXISTS tech_questions (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        stack_id        INT NOT NULL,
        topic_id        INT DEFAULT NULL,
        level           ENUM('junior', 'intermediate', 'advanced') NOT NULL DEFAULT 'junior',
        title           VARCHAR(255) NOT NULL,
        question        TEXT NOT NULL,
        quick_answer    TEXT NOT NULL,
        detailed_answer MEDIUMTEXT NOT NULL,
        code_example    MEDIUMTEXT,
        interview_tips  TEXT,
        practical_tips  TEXT,
        tags            VARCHAR(255),
        sort_order      INT DEFAULT 0,
        created_by      VARCHAR(64) DEFAULT 'ai',
        is_active       TINYINT DEFAULT 1,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_stack_level (stack_id, level),
        INDEX idx_active (is_active),
        FOREIGN KEY (stack_id) REFERENCES tech_stacks(id) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES tech_topics(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await helpers.addColumnIfMissing('tech_questions', 'sort_order', 'INT NOT NULL DEFAULT 0');


    await db.query(`
      CREATE TABLE IF NOT EXISTS tech_user_progress (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        user_id          VARCHAR(64) NOT NULL,
        username         VARCHAR(128) NOT NULL DEFAULT 'admin',
        question_id      INT NOT NULL,
        status           ENUM('unstudied', 'studying', 'mastered') NOT NULL DEFAULT 'unstudied',
        is_bookmarked    TINYINT DEFAULT 0,
        personal_notes   TEXT NULL,
        last_practiced_at DATETIME NULL,
        last_studied_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_question (user_id, question_id),
        FOREIGN KEY (question_id) REFERENCES tech_questions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await helpers.addColumnIfMissing('tech_user_progress', 'username', 'VARCHAR(128) NOT NULL DEFAULT "admin"');
    await helpers.addColumnIfMissing('tech_user_progress', 'personal_notes', 'TEXT NULL');
    await helpers.addColumnIfMissing('tech_user_progress', 'last_practiced_at', 'DATETIME NULL');

};





