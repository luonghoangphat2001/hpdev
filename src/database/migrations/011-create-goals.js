/**
 * @fileoverview 011-create-goals - Provides 011-create-goals functionality.
 */
'use strict';

module.exports = Object.freeze({
  id: '011-create-goals',
  up: `
    CREATE TABLE IF NOT EXISTS goals (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      goal_id VARCHAR(128) NOT NULL,
      parent_goal_id VARCHAR(128) NULL,
      horizon VARCHAR(16) NOT NULL,
      title VARCHAR(500) NOT NULL,
      description VARCHAR(2000) NULL,
      owner_type VARCHAR(32) NOT NULL,
      owner_id VARCHAR(128) NOT NULL,
      target JSON NOT NULL,
      progress DECIMAL(7,4) NOT NULL DEFAULT 0,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      starts_at DATETIME(3) NOT NULL,
      deadline_at DATETIME(3) NOT NULL,
      version INT UNSIGNED NOT NULL DEFAULT 1,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_goals_goal_id (goal_id),
      KEY idx_goals_parent (parent_goal_id),
      KEY idx_goals_owner (owner_type, owner_id, status),
      KEY idx_goals_horizon_deadline (horizon, deadline_at, status),
      CONSTRAINT fk_goals_parent FOREIGN KEY (parent_goal_id)
        REFERENCES goals (goal_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT chk_goals_horizon
        CHECK (horizon IN ('year', 'quarter', 'month', 'week')),
      CONSTRAINT chk_goals_owner_type
        CHECK (owner_type IN ('ceo', 'agent', 'department')),
      CONSTRAINT chk_goals_progress CHECK (progress BETWEEN 0 AND 1),
      CONSTRAINT chk_goals_deadline CHECK (deadline_at > starts_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS goals;',
});
