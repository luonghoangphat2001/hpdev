'use strict';

const migration = Object.freeze({
  id: '007-create-dead-letters',
  up: `
    CREATE TABLE dead_letters (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      dead_letter_id VARCHAR(128) NOT NULL,
      source_type VARCHAR(64) NOT NULL,
      source_id VARCHAR(128) NOT NULL,
      event_id VARCHAR(128) NULL,
      workflow_id VARCHAR(128) NULL,
      action_id VARCHAR(128) NULL,
      correlation_id VARCHAR(128) NOT NULL,
      payload_snapshot JSON NOT NULL,
      payload_hash CHAR(64) NOT NULL,
      error_code VARCHAR(128) NOT NULL,
      error_class VARCHAR(255) NULL,
      error_message VARCHAR(2000) NOT NULL,
      error_details JSON NULL,
      attempt_count INT UNSIGNED NOT NULL,
      first_failed_at DATETIME(3) NOT NULL,
      last_failed_at DATETIME(3) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'open',
      resolution VARCHAR(2000) NULL,
      resolved_by VARCHAR(128) NULL,
      resolved_at DATETIME(3) NULL,
      replay_job_id VARCHAR(128) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_dead_letters_dead_letter_id (dead_letter_id),
      UNIQUE KEY uq_dead_letters_failure
        (source_type, source_id, payload_hash),
      KEY idx_dead_letters_inbox (status, last_failed_at),
      KEY idx_dead_letters_workflow (workflow_id, status),
      KEY idx_dead_letters_error (error_code, status, last_failed_at),
      KEY idx_dead_letters_correlation (correlation_id),
      CONSTRAINT chk_dead_letters_attempt_count
        CHECK (attempt_count > 0),
      CONSTRAINT chk_dead_letters_failure_time
        CHECK (last_failed_at >= first_failed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS dead_letters;',
});

module.exports = migration;
