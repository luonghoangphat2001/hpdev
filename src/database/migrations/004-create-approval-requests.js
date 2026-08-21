/**
 * @fileoverview 004-create-approval-requests - Provides 004-create-approval-requests functionality.
 */
'use strict';

const migration = Object.freeze({
  id: '004-create-approval-requests',
  up: `
    CREATE TABLE approval_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      approval_id VARCHAR(128) NOT NULL,
      workflow_id VARCHAR(128) NOT NULL,
      action_id VARCHAR(128) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      decision_version INT UNSIGNED NOT NULL DEFAULT 1,
      risk_level VARCHAR(16) NOT NULL,
      permission_scope VARCHAR(160) NOT NULL,
      payload_hash CHAR(64) NOT NULL,
      request_snapshot JSON NOT NULL,
      requested_by VARCHAR(128) NOT NULL,
      requested_at DATETIME(3) NOT NULL,
      expires_at DATETIME(3) NOT NULL,
      decided_by VARCHAR(128) NULL,
      decision_reason VARCHAR(2000) NULL,
      decided_at DATETIME(3) NULL,
      consumed_at DATETIME(3) NULL,
      consumed_by VARCHAR(128) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_approval_requests_approval_id (approval_id),
      KEY idx_approval_requests_workflow (workflow_id, status),
      KEY idx_approval_requests_action (action_id, status),
      KEY idx_approval_requests_inbox (status, expires_at, requested_at),
      CONSTRAINT fk_approval_requests_workflow_id
        FOREIGN KEY (workflow_id) REFERENCES workflows (workflow_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT fk_approval_requests_action_id
        FOREIGN KEY (action_id) REFERENCES workflow_actions (action_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT chk_approval_requests_risk_level
        CHECK (risk_level IN ('medium', 'high', 'critical')),
      CONSTRAINT chk_approval_requests_expiry
        CHECK (expires_at > requested_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS approval_requests;',
});

module.exports = migration;
