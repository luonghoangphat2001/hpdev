/**
 * @fileoverview 010-create-intelligence-observability - Provides 010-create-intelligence-observability functionality.
 */
'use strict';

module.exports = Object.freeze({
  id: '010-create-intelligence-observability',
  up: `
    CREATE TABLE IF NOT EXISTS intelligence_traces (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      trace_id VARCHAR(128) NOT NULL,
      span_id VARCHAR(128) NOT NULL,
      parent_span_id VARCHAR(128) NULL,
      workflow_id VARCHAR(128) NOT NULL,
      stage VARCHAR(32) NOT NULL,
      component_id VARCHAR(128) NOT NULL,
      status VARCHAR(32) NOT NULL,
      latency_ms INT UNSIGNED NOT NULL,
      tokens_in INT UNSIGNED NOT NULL DEFAULT 0,
      tokens_out INT UNSIGNED NOT NULL DEFAULT 0,
      cost_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
      error_code VARCHAR(128) NULL,
      metadata JSON NOT NULL,
      occurred_at DATETIME(3) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_intelligence_traces_span (trace_id, span_id),
      KEY idx_intelligence_traces_workflow (workflow_id, occurred_at),
      KEY idx_intelligence_traces_component (stage, component_id, occurred_at),
      KEY idx_intelligence_traces_status (status, occurred_at),
      CONSTRAINT chk_intelligence_traces_stage
        CHECK (stage IN ('planner', 'agent', 'model', 'tool'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    ALTER TABLE workflow_feedback
      ADD COLUMN review_status VARCHAR(32) NOT NULL DEFAULT 'pending' AFTER comment,
      ADD COLUMN reviewed_at DATETIME(3) NULL AFTER review_status,
      ADD KEY idx_workflow_feedback_queue (review_status, rating, created_at);
  `,
  down: `
    ALTER TABLE workflow_feedback
      DROP KEY idx_workflow_feedback_queue,
      DROP COLUMN reviewed_at,
      DROP COLUMN review_status;
    DROP TABLE IF EXISTS intelligence_traces;
  `,
});
