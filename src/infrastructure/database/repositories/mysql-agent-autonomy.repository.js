'use strict';

const OptimisticLockError = require('../../../domain/errors/optimistic-lock.error');

class MysqlAgentAutonomyRepository {
  constructor(executor) {
    this.executor = executor;
  }

  async findByAgentId(agentId) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM agent_autonomy_settings WHERE agent_id = ? LIMIT 1',
      [agentId],
    );
    return rows[0] || null;
  }

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
}

module.exports = MysqlAgentAutonomyRepository;
