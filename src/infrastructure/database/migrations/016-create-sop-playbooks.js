'use strict';

module.exports = Object.freeze({
  id: '016-create-sop-playbooks',
  up: `
    CREATE TABLE sop_playbooks (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      sop_id VARCHAR(128) NOT NULL,
      name VARCHAR(500) NOT NULL,
      owner_agent_id VARCHAR(128) NOT NULL,
      active_version INT UNSIGNED NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_sop_playbooks_id (sop_id),
      KEY idx_sop_playbooks_owner (owner_agent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE sop_versions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      sop_id VARCHAR(128) NOT NULL,
      version INT UNSIGNED NOT NULL,
      definition JSON NOT NULL,
      definition_hash CHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      effective_at DATETIME(3) NOT NULL,
      approved_by VARCHAR(128) NULL,
      approved_at DATETIME(3) NULL,
      created_by VARCHAR(128) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_sop_versions (sop_id, version),
      KEY idx_sop_versions_effective (status, effective_at),
      CONSTRAINT fk_sop_versions_playbook FOREIGN KEY (sop_id)
        REFERENCES sop_playbooks (sop_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
      CONSTRAINT chk_sop_version_status
        CHECK (status IN ('draft', 'approved', 'active', 'retired'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: `
    DROP TABLE IF EXISTS sop_versions;
    DROP TABLE IF EXISTS sop_playbooks;
  `,
});
