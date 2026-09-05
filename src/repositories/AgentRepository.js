/**
 * @fileoverview AgentRepository - Provides agent functionality.
 */
"use strict";

const OptimisticLockError = require("@utils/errors/optimistic-lock.error");

/**
 * AgentRepository
 * Manages agent logic.
 */
class AgentRepository {
  /**
   * constructor - Executes constructor.
   * @param {*} executor - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(executor) {
    this.executor = executor;
  }

  // --- Autonomy Methods ---
  /**
   * findByAgentId - Asynchronously executes find by agent id.
   * @param {*} agentId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async findByAgentId(agentId) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM agent_autonomy_settings WHERE agent_id = ? LIMIT 1',
      [agentId],
    );
    return rows[0] || null;
  }

  /**
   * upsert - Asynchronously executes upsert.
   * @param {*} settings - Input parameter.
   * @param {*} expectedVersion - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async upsert(settings, expectedVersion = null) {
    if (expectedVersion === null) {
      await this.executor.execute(
        `INSERT INTO agent_autonomy_settings (
           agent_id, goal_id, autonomy_level, limits, enabled, changed_by, changed_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          settings.agentId, settings.goalId, settings.autonomyLevel,
          JSON.stringify(settings.limits), settings.enabled ? 1 : 0,
          settings.changedBy, settings.changedAt,
        ],
      );
      return true;
    }
    const [result] = await this.executor.execute(
      `UPDATE agent_autonomy_settings
       SET goal_id = ?, autonomy_level = ?, limits = ?, enabled = ?,
           version = version + 1, changed_by = ?, changed_at = ?
       WHERE agent_id = ? AND version = ?`,
      [
        settings.goalId, settings.autonomyLevel, JSON.stringify(settings.limits),
        settings.enabled ? 1 : 0, settings.changedBy, settings.changedAt,
        settings.agentId, expectedVersion,
      ],
    );
    if (result.affectedRows !== 1) {
      throw new OptimisticLockError('agent_autonomy', settings.agentId, expectedVersion);
    }
    return true;
  }

  // --- Report Methods ---
  /**
   * summarizeAgent - Asynchronously executes summarize agent.
   * @param {*} agentId - Input parameter.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async summarizeAgent(agentId, from, to) {
    const [rows] = await this.executor.execute(
      `SELECT
         COUNT(*) AS workflow_count,
         COALESCE(SUM(w.state = 'completed'), 0) AS completed_count,
         COALESCE(SUM(w.state = 'failed'), 0) AS failed_count,
         COALESCE(SUM(w.state = 'awaiting_approval'), 0) AS awaiting_approval_count,
         (SELECT COUNT(*) FROM workflow_actions wa
          INNER JOIN workflows aw ON aw.workflow_id = wa.workflow_id
          WHERE aw.assigned_agent_id = ? AND wa.created_at >= ? AND wa.created_at < ?)
           AS action_count
       FROM workflows w
       WHERE w.assigned_agent_id = ? AND w.created_at >= ? AND w.created_at < ?`,
      [agentId, from, to, agentId, from, to],
    );
    const summary = rows[0] || {};
    return Object.freeze({
      workflowCount: Number(summary.workflow_count || 0),
      completedCount: Number(summary.completed_count || 0),
      failedCount: Number(summary.failed_count || 0),
      awaitingApprovalCount: Number(summary.awaiting_approval_count || 0),
      actionCount: Number(summary.action_count || 0),
    });
  }

  // --- Runtime State Methods ---
  /**
   * findForUpdate - Asynchronously executes find for update.
   * @param {*} agentId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async findForUpdate(agentId) {
    const [rows] = await this.executor.execute(
      `SELECT * FROM agent_runtime_states
       WHERE agent_id = ? LIMIT 1 FOR UPDATE`,
      [agentId],
    );
    return rows[0] || null;
  }

  async transition(agentId, expectedVersion, {
    lifecycleState,
    reason,
    changedBy,
    changedAt,
  }) {
    const [result] = await this.executor.execute(
      `UPDATE agent_runtime_states
       SET lifecycle_state = ?, state_version = state_version + 1,
           reason = ?, changed_by = ?, changed_at = ?
       WHERE agent_id = ? AND state_version = ?`,
      [lifecycleState, reason, changedBy, changedAt, agentId, expectedVersion],
    );
    return result.affectedRows === 1;
  }

  // --- Memory Methods ---
  /**
   * upsert - Asynchronously executes upsert.
   * @param {*} memory - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * findForScopes - Asynchronously executes find for scopes.
   * @param {*} agentId - Input parameter.
   * @param {*} scopes - Input parameter.
   * @param {*} at - Input parameter.
   * @param {*} limit - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

module.exports = AgentRepository;
