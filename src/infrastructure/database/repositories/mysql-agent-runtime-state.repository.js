'use strict';

class MysqlAgentRuntimeStateRepository {
  constructor(executor) {
    if (!executor || typeof executor.execute !== 'function') {
      throw new TypeError('Agent runtime state repository requires a database executor');
    }
    this.executor = executor;
  }

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
}

module.exports = MysqlAgentRuntimeStateRepository;
