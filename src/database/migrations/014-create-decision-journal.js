/**
 * @fileoverview 014-create-decision-journal - Provides 014-create-decision-journal functionality.
 */
'use strict';

module.exports = Object.freeze({
  id: '014-create-decision-journal',
  up: `
    CREATE TABLE IF NOT EXISTS decision_journal (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      decision_id VARCHAR(128) NOT NULL,
      workflow_id VARCHAR(128) NULL,
      goal_id VARCHAR(128) NULL,
      approval_id VARCHAR(128) NULL,
      actor_id VARCHAR(128) NOT NULL,
      decision_type VARCHAR(128) NOT NULL,
      decision VARCHAR(500) NOT NULL,
      rationale VARCHAR(2000) NOT NULL,
      input_snapshot JSON NOT NULL,
      input_hash CHAR(64) NOT NULL,
      policy_version VARCHAR(32) NOT NULL,
      expected_outcome JSON NULL,
      actual_outcome JSON NULL,
      outcome_status VARCHAR(32) NOT NULL DEFAULT 'pending',
      decided_at DATETIME(3) NOT NULL,
      reviewed_at DATETIME(3) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_decision_journal_id (decision_id),
      KEY idx_decision_journal_workflow (workflow_id, decided_at),
      KEY idx_decision_journal_goal (goal_id, decided_at),
      KEY idx_decision_journal_outcome (outcome_status, decided_at),
      CONSTRAINT fk_decision_journal_workflow FOREIGN KEY (workflow_id)
        REFERENCES workflows (workflow_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT fk_decision_journal_goal FOREIGN KEY (goal_id)
        REFERENCES goals (goal_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT chk_decision_outcome_status
        CHECK (outcome_status IN ('pending', 'positive', 'neutral', 'negative'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS decision_journal;',
});
