'use strict';

module.exports = Object.freeze({
  id: '012-create-ceo-command-requests',
  up: `
    CREATE TABLE ceo_command_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      request_id VARCHAR(128) NOT NULL,
      idempotency_key VARCHAR(160) NOT NULL,
      command_name VARCHAR(160) NOT NULL,
      command_version VARCHAR(32) NOT NULL,
      actor_id VARCHAR(128) NOT NULL,
      risk_level VARCHAR(16) NOT NULL,
      payload JSON NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'processing',
      result JSON NULL,
      error_code VARCHAR(128) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      completed_at DATETIME(3) NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_ceo_command_request_id (request_id),
      UNIQUE KEY uq_ceo_command_idempotency (idempotency_key),
      KEY idx_ceo_command_queue (status, created_at),
      KEY idx_ceo_command_actor (actor_id, created_at),
      CONSTRAINT chk_ceo_command_risk
        CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS ceo_command_requests;',
});
