'use strict';

const migration = Object.freeze({
  id: '006-create-outbox-jobs',
  up: `
    CREATE TABLE outbox_jobs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      job_id VARCHAR(128) NOT NULL,
      job_key VARCHAR(200) NOT NULL,
      job_type VARCHAR(128) NOT NULL,
      workflow_id VARCHAR(128) NULL,
      action_id VARCHAR(128) NULL,
      correlation_id VARCHAR(128) NOT NULL,
      payload JSON NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      priority SMALLINT UNSIGNED NOT NULL DEFAULT 50,
      attempts INT UNSIGNED NOT NULL DEFAULT 0,
      max_attempts INT UNSIGNED NOT NULL DEFAULT 3,
      available_at DATETIME(3) NOT NULL,
      leased_at DATETIME(3) NULL,
      lease_expires_at DATETIME(3) NULL,
      leased_by VARCHAR(128) NULL,
      delivered_at DATETIME(3) NULL,
      delivery_receipt JSON NULL,
      last_error_code VARCHAR(128) NULL,
      last_error_message VARCHAR(2000) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_outbox_jobs_job_id (job_id),
      UNIQUE KEY uq_outbox_jobs_job_key (job_key),
      KEY idx_outbox_jobs_claim (status, available_at, priority),
      KEY idx_outbox_jobs_lease_recovery (status, lease_expires_at),
      KEY idx_outbox_jobs_workflow (workflow_id, status),
      KEY idx_outbox_jobs_action (action_id, status),
      CONSTRAINT fk_outbox_jobs_workflow_id
        FOREIGN KEY (workflow_id) REFERENCES workflows (workflow_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT fk_outbox_jobs_action_id
        FOREIGN KEY (action_id) REFERENCES workflow_actions (action_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT chk_outbox_jobs_attempts
        CHECK (attempts <= max_attempts),
      CONSTRAINT chk_outbox_jobs_priority
        CHECK (priority BETWEEN 0 AND 100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS outbox_jobs;',
});

module.exports = migration;
