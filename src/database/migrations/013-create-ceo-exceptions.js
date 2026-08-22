/**
 * @fileoverview 013-create-ceo-exceptions - Provides 013-create-ceo-exceptions functionality.
 */
'use strict';

module.exports = Object.freeze({
  id: '013-create-ceo-exceptions',
  up: `
    CREATE TABLE IF NOT EXISTS ceo_exceptions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      exception_id VARCHAR(128) NOT NULL,
      source_type VARCHAR(32) NOT NULL,
      source_id VARCHAR(128) NOT NULL,
      workflow_id VARCHAR(128) NULL,
      severity VARCHAR(16) NOT NULL,
      title VARCHAR(500) NOT NULL,
      context JSON NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'open',
      occurred_at DATETIME(3) NOT NULL,
      acknowledged_by VARCHAR(128) NULL,
      acknowledged_at DATETIME(3) NULL,
      resolved_at DATETIME(3) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_ceo_exceptions_id (exception_id),
      UNIQUE KEY uq_ceo_exceptions_source (source_type, source_id),
      KEY idx_ceo_exceptions_inbox (status, severity, occurred_at),
      KEY idx_ceo_exceptions_workflow (workflow_id, status),
      CONSTRAINT chk_ceo_exceptions_source
        CHECK (source_type IN ('approval', 'dead_letter', 'conflict', 'kpi_deviation')),
      CONSTRAINT chk_ceo_exceptions_severity
        CHECK (severity IN ('medium', 'high', 'critical'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS ceo_exceptions;',
});
