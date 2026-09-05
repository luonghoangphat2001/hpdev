/**
 * @fileoverview 001-create-orchestrator-events - Provides 001-create-orchestrator-events functionality.
 */
'use strict';

const migration = Object.freeze({
  id: '001-create-orchestrator-events',
  up: `
    CREATE TABLE orchestrator_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      event_id VARCHAR(128) NOT NULL,
      schema_version VARCHAR(32) NOT NULL,
      event_type VARCHAR(128) NOT NULL,
      source VARCHAR(64) NOT NULL,
      occurred_at DATETIME(3) NOT NULL,
      received_at DATETIME(3) NOT NULL,
      correlation_id VARCHAR(128) NULL,
      delivery_id VARCHAR(128) NOT NULL,
      raw_payload JSON NOT NULL,
      payload_hash CHAR(64) NOT NULL,
      signature_valid TINYINT(1) NOT NULL,
      signature_key_id VARCHAR(128) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'received',
      processing_attempts INT UNSIGNED NOT NULL DEFAULT 0,
      last_error_code VARCHAR(128) NULL,
      last_error_message VARCHAR(2000) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_orchestrator_events_event_id (event_id),
      UNIQUE KEY uq_orchestrator_events_delivery_id (delivery_id),
      KEY idx_orchestrator_events_status_received (status, received_at),
      KEY idx_orchestrator_events_correlation_id (correlation_id),
      KEY idx_orchestrator_events_type_occurred (event_type, occurred_at),
      CONSTRAINT chk_orchestrator_events_signature_valid
        CHECK (signature_valid IN (0, 1))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS orchestrator_events;',
});

module.exports = migration;
