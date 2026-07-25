'use strict';

const GoalRepository = require('../../../domain/repositories/goal.repository');
const OptimisticLockError = require('../../../domain/errors/optimistic-lock.error');

class MysqlGoalRepository extends GoalRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

  async create(goal) {
    await this.executor.execute(
      `INSERT INTO goals (
         goal_id, parent_goal_id, horizon, title, description, owner_type,
         owner_id, target, progress, status, starts_at, deadline_at, version
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.goalId, goal.parentGoalId, goal.horizon, goal.title, goal.description,
        goal.ownerType, goal.ownerId, JSON.stringify(goal.target), goal.progress,
        goal.status, goal.startsAt, goal.deadlineAt, goal.version,
      ],
    );
    return goal;
  }

  async findById(goalId) {
    const [rows] = await this.executor.execute(
      'SELECT * FROM goals WHERE goal_id = ? LIMIT 1',
      [goalId],
    );
    return rows[0] || null;
  }

  async update(goal, expectedVersion) {
    const [result] = await this.executor.execute(
      `UPDATE goals SET status = ?, progress = ?, version = version + 1
       WHERE goal_id = ? AND version = ?`,
      [goal.status, goal.progress, goal.goalId, expectedVersion],
    );
    if (result.affectedRows !== 1) {
      throw new OptimisticLockError('goal', goal.goalId, expectedVersion);
    }
    return goal;
  }
}

module.exports = MysqlGoalRepository;
