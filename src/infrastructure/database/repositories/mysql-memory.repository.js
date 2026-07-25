'use strict';

const MemoryRepository = require('../../../domain/repositories/memory.repository');

class MysqlMemoryRepository extends MemoryRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

  async upsert(memory) {
    await this.executor.execute(
      `INSERT INTO agent_memories (
         memory_id, agent_id, scope_type, scope_id, memory_key,
         memory_value, source_ref, expires_at, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         memory_value = VALUES(memory_value),
         source_ref = VALUES(source_ref),
         expires_at = VALUES(expires_at)`,
      [
        memory.memoryId,
        memory.agentId,
        memory.scopeType,
        memory.scopeId,
        memory.key,
        JSON.stringify(memory.value),
        memory.sourceRef,
        memory.expiresAt,
        memory.createdAt,
      ],
    );
    return memory;
  }

  async findForScopes(agentId, scopes, at, limit = 100) {
    if (!Array.isArray(scopes) || scopes.length === 0) return [];
    const clauses = scopes.map(() => '(scope_type = ? AND scope_id = ?)').join(' OR ');
    const params = scopes.flatMap(({ type, id }) => [type, String(id)]);
    const [rows] = await this.executor.execute(
      `SELECT * FROM agent_memories
       WHERE agent_id = ? AND expires_at > ? AND (${clauses})
       ORDER BY updated_at DESC LIMIT ?`,
      [agentId, at, ...params, Math.min(Math.max(Number(limit) || 100, 1), 200)],
    );
    return rows;
  }
}

module.exports = MysqlMemoryRepository;
