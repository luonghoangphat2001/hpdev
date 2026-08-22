/**
 * @fileoverview 008-create-agent-memories - Provides 008-create-agent-memories functionality.
 */
'use strict';

module.exports = Object.freeze({
  id: '008-create-agent-memories',
  up: `
    CREATE TABLE IF NOT EXISTS agent_memories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      memory_id VARCHAR(128) NOT NULL,
      agent_id VARCHAR(128) NOT NULL,
      scope_type VARCHAR(32) NOT NULL,
      scope_id VARCHAR(128) NOT NULL,
      memory_key VARCHAR(160) NOT NULL,
      memory_value JSON NOT NULL,
      source_ref VARCHAR(255) NOT NULL,
      expires_at DATETIME(3) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_agent_memories_memory_id (memory_id),
      UNIQUE KEY uq_agent_memories_scope_key
        (agent_id, scope_type, scope_id, memory_key),
      KEY idx_agent_memories_context
        (agent_id, scope_type, scope_id, expires_at),
      KEY idx_agent_memories_expiry (expires_at),
      CONSTRAINT chk_agent_memories_scope
        CHECK (scope_type IN ('workflow', 'agent', 'customer'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  down: 'DROP TABLE IF EXISTS agent_memories;',
});
