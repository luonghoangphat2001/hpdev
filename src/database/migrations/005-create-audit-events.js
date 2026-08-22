/**
 * @fileoverview 005-create-audit-events - Provides 005-create-audit-events functionality.
 */
'use strict';

const migration = Object.freeze({
  id: '005-create-audit-events',
  up: `
    CREATE TABLE IF NOT EXISTS audit_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      audit_id VARCHAR(128) NOT NULL,
      occurred_at DATETIME(3) NOT NULL,
      correlation_id VARCHAR(128) NOT NULL,
      event_id VARCHAR(128) NULL,
      workflow_id VARCHAR(128) NULL,
      action_id VARCHAR(128) NULL,
      approval_id VARCHAR(128) NULL,
      actor_type VARCHAR(64) NOT NULL,
      actor_id VARCHAR(128) NOT NULL,
      audit_type VARCHAR(128) NOT NULL,
      from_state VARCHAR(64) NULL,
      to_state VARCHAR(64) NULL,
      outcome VARCHAR(32) NOT NULL,
      policy_version VARCHAR(32) NULL,
      details JSON NOT NULL,
      previous_hash CHAR(64) NULL,
      entry_hash CHAR(64) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_audit_events_audit_id (audit_id),
      UNIQUE KEY uq_audit_events_entry_hash (entry_hash),
      KEY idx_audit_events_correlation (correlation_id, occurred_at),
      KEY idx_audit_events_workflow (workflow_id, occurred_at),
      KEY idx_audit_events_action (action_id, occurred_at),
      KEY idx_audit_events_actor (actor_type, actor_id, occurred_at),
      KEY idx_audit_events_type (audit_type, occurred_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TRIGGER audit_events_block_update
      BEFORE UPDATE ON audit_events
      FOR EACH ROW
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'audit_events is append-only';

    CREATE TRIGGER audit_events_block_delete
      BEFORE DELETE ON audit_events
      FOR EACH ROW
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'audit_events is append-only';
  `,
  down: `
    DROP TRIGGER IF EXISTS audit_events_block_delete;
    DROP TRIGGER IF EXISTS audit_events_block_update;
    DROP TABLE IF EXISTS audit_events;
  `,
});

module.exports = migration;
