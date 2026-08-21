/**
 * @fileoverview 003-create-workflow-actions - Provides 003-create-workflow-actions functionality.
 */
'use strict';

const migration = Object.freeze({
  id: '003-create-workflow-actions',
  up: `
    CREATE TABLE workflow_actions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      action_id VARCHAR(128) NOT NULL,
      workflow_id VARCHAR(128) NOT NULL,
      sequence_no INT UNSIGNED NOT NULL,
      action_name VARCHAR(160) NOT NULL,
      permission_scope VARCHAR(160) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'proposed',
      risk_level VARCHAR(16) NOT NULL,
      request_payload JSON NOT NULL,
      payload_hash CHAR(64) NOT NULL,
      idempotency_key VARCHAR(160) NOT NULL,
      expected_resource_version VARCHAR(128) NULL,
      retry_count INT UNSIGNED NOT NULL DEFAULT 0,
      max_attempts INT UNSIGNED NOT NULL DEFAULT 1,
      ssot_receipt JSON NULL,
      receipt_hash CHAR(64) NULL,
      last_error_code VARCHAR(128) NULL,
      last_error_message VARCHAR(2000) NULL,
      scheduled_at DATETIME(3) NULL,
      started_at DATETIME(3) NULL,
      completed_at DATETIME(3) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_workflow_actions_action_id (action_id),
      UNIQUE KEY uq_workflow_actions_idempotency_key (idempotency_key),
      UNIQUE KEY uq_workflow_actions_sequence (workflow_id, sequence_no),
      KEY idx_workflow_actions_dispatch (status, scheduled_at),
      KEY idx_workflow_actions_workflow_status (workflow_id, status),
      CONSTRAINT fk_workflow_actions_workflow_id
        FOREIGN KEY (workflow_id) REFERENCES workflows (workflow_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT chk_workflow_actions_risk_level
        CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
      CONSTRAINT chk_workflow_actions_attempts
        CHECK (retry_count <= max_attempts)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS workflow_actions;',
});

module.exports = migration;
