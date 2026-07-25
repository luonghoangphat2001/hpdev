'use strict';

const migration = Object.freeze({
  id: '002-create-workflows',
  up: `
    CREATE TABLE workflows (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      workflow_id VARCHAR(128) NOT NULL,
      event_id VARCHAR(128) NULL,
      correlation_id VARCHAR(128) NOT NULL,
      workflow_type VARCHAR(128) NOT NULL,
      state VARCHAR(32) NOT NULL DEFAULT 'received',
      state_version INT UNSIGNED NOT NULL DEFAULT 1,
      assigned_agent_id VARCHAR(128) NULL,
      risk_level VARCHAR(16) NOT NULL,
      priority SMALLINT UNSIGNED NOT NULL DEFAULT 50,
      policy_version VARCHAR(32) NOT NULL,
      input_context JSON NOT NULL,
      result_payload JSON NULL,
      failure_code VARCHAR(128) NULL,
      failure_reason VARCHAR(2000) NULL,
      queued_at DATETIME(3) NULL,
      started_at DATETIME(3) NULL,
      completed_at DATETIME(3) NULL,
      deadline_at DATETIME(3) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_workflows_workflow_id (workflow_id),
      KEY idx_workflows_event_id (event_id),
      KEY idx_workflows_correlation_id (correlation_id),
      KEY idx_workflows_agent_state (assigned_agent_id, state),
      KEY idx_workflows_queue (state, priority, queued_at),
      KEY idx_workflows_deadline (state, deadline_at),
      CONSTRAINT fk_workflows_event_id
        FOREIGN KEY (event_id) REFERENCES orchestrator_events (event_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT chk_workflows_risk_level
        CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
      CONSTRAINT chk_workflows_priority
        CHECK (priority BETWEEN 0 AND 100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS workflows;',
});

module.exports = migration;
