/**
 * @fileoverview 015-create-agent-autonomy-settings - Provides 015-create-agent-autonomy-settings functionality.
 */
'use strict';

module.exports = Object.freeze({
  id: '015-create-agent-autonomy-settings',
  up: `
    CREATE TABLE IF NOT EXISTS agent_autonomy_settings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      agent_id VARCHAR(128) NOT NULL,
      goal_id VARCHAR(128) NULL,
      autonomy_level VARCHAR(32) NOT NULL DEFAULT 'OBSERVE',
      limits JSON NOT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      version INT UNSIGNED NOT NULL DEFAULT 1,
      changed_by VARCHAR(128) NOT NULL,
      changed_at DATETIME(3) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_agent_autonomy_agent (agent_id),
      KEY idx_agent_autonomy_goal (goal_id),
      CONSTRAINT fk_agent_autonomy_goal FOREIGN KEY (goal_id)
        REFERENCES goals (goal_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT chk_agent_autonomy_level CHECK (autonomy_level IN (
        'OBSERVE', 'PROPOSE', 'EXECUTE_LOW_RISK', 'FULL_WITH_LIMITS'
      ))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS agent_autonomy_settings;',
});
