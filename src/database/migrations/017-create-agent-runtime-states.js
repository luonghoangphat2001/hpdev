/**
 * @fileoverview 017-create-agent-runtime-states - Provides 017-create-agent-runtime-states functionality.
 */
'use strict';

module.exports = Object.freeze({
  id: '017-create-agent-runtime-states',
  up: `
    CREATE TABLE IF NOT EXISTS agent_runtime_states (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      agent_id VARCHAR(128) NOT NULL,
      lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      state_version INT UNSIGNED NOT NULL DEFAULT 1,
      reason VARCHAR(1000) NULL,
      changed_by VARCHAR(128) NOT NULL,
      changed_at DATETIME(3) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_agent_runtime_state_agent (agent_id),
      KEY idx_agent_runtime_state (lifecycle_state, updated_at),
      CONSTRAINT chk_agent_runtime_lifecycle_state CHECK (lifecycle_state IN (
        'DRAFT', 'TESTING', 'ACTIVE', 'PAUSED', 'SUSPENDED',
        'QUARANTINED', 'FIXING', 'CANARY', 'RETIRED'
      ))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    INSERT INTO agent_runtime_states
      (agent_id, lifecycle_state, state_version, reason, changed_by, changed_at)
    VALUES
      ('dan_rnd', 'ACTIVE', 1, 'Initial registered state', 'system', CURRENT_TIMESTAMP(3)),
      ('dan_logistics', 'ACTIVE', 1, 'Initial registered state', 'system', CURRENT_TIMESTAMP(3)),
      ('dan_cfo', 'ACTIVE', 1, 'Initial registered state', 'system', CURRENT_TIMESTAMP(3)),
      ('dan_ops', 'ACTIVE', 1, 'Initial registered state', 'system', CURRENT_TIMESTAMP(3)),
      ('dan_cskh', 'ACTIVE', 1, 'Initial registered state', 'system', CURRENT_TIMESTAMP(3));
  `,
  down: 'DROP TABLE IF EXISTS agent_runtime_states;',
});
