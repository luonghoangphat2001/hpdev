'use strict';

module.exports = Object.freeze({
  id: '009-add-operator-control',
  up: `
    ALTER TABLE workflows
      ADD COLUMN paused_from_state VARCHAR(32) NULL AFTER state;

    CREATE TABLE workflow_feedback (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      feedback_id VARCHAR(128) NOT NULL,
      workflow_id VARCHAR(128) NOT NULL,
      actor_id VARCHAR(128) NOT NULL,
      rating SMALLINT NOT NULL,
      comment VARCHAR(2000) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_workflow_feedback_id (feedback_id),
      KEY idx_workflow_feedback_workflow (workflow_id, created_at),
      CONSTRAINT fk_workflow_feedback_workflow
        FOREIGN KEY (workflow_id) REFERENCES workflows (workflow_id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT chk_workflow_feedback_rating CHECK (rating BETWEEN 1 AND 5)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: `
    DROP TABLE IF EXISTS workflow_feedback;
    ALTER TABLE workflows DROP COLUMN paused_from_state;
  `,
});
