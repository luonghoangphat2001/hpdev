/**
 * @fileoverview goal.service - Provides goal functionality.
 */
'use strict';

const crypto = require('crypto');
const Goal = require('@services/workflow/action/goal');
const { HORIZONS } = require('@services/workflow/action/goal');

/**
 * GoalService
 * Manages goal logic.
 */
class GoalService {
  constructor({
    repository,
    idFactory = () => `gol_${crypto.randomUUID()}`,
  }) {
    this.repository = repository;
    this.idFactory = idFactory;
  }

  /**
   * create - Asynchronously executes create.
   * @param {*} input - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async create(input) {
    const goal = new Goal({ ...input, goalId: input.goalId || this.idFactory() });
    if (goal.parentGoalId) {
      const parentRow = await this.repository.findById(goal.parentGoalId);
      if (!parentRow) throw new TypeError('Parent goal not found');
      const parent = this.#hydrate(parentRow);
      if (HORIZONS.indexOf(goal.horizon) <= HORIZONS.indexOf(parent.horizon)) {
        throw new TypeError('Child goal horizon must be shorter than parent horizon');
      }
      if (goal.startsAt < parent.startsAt || goal.deadlineAt > parent.deadlineAt) {
        throw new TypeError('Child goal dates must fit within parent goal');
      }
    }
    return this.repository.create(goal);
  }

  /**
   * transition - Asynchronously executes transition.
   * @param {*} goalId - Input parameter.
   * @param {*} expectedVersion - Input parameter.
   * @param {*} toStatus - Input parameter.
   * @param {*} progress - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async transition(goalId, expectedVersion, toStatus, progress) {
    const row = await this.repository.findById(goalId);
    if (!row) throw new TypeError('Goal not found');
    const current = this.#hydrate(row);
    if (current.version !== expectedVersion) {
      throw new TypeError('Goal version conflict');
    }
    const updated = current.transition(toStatus, progress);
    return this.repository.update(updated, expectedVersion);
  }

  #hydrate(row) {
    return new Goal({
      goalId: row.goal_id,
      parentGoalId: row.parent_goal_id,
      horizon: row.horizon,
      title: row.title,
      description: row.description,
      ownerType: row.owner_type,
      ownerId: row.owner_id,
      target: typeof row.target === 'string' ? JSON.parse(row.target) : row.target,
      progress: Number(row.progress),
      status: row.status,
      startsAt: row.starts_at,
      deadlineAt: row.deadline_at,
      version: Number(row.version),
    });
  }
}

module.exports = GoalService;
