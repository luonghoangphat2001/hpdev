'use strict';

class TaskRepository {
  #db;

  constructor(db) {
    this.#db = db;
  }

  /** @returns {Promise<number>} new task id */
  async create({ userId, username, platform, channelId, description }) {
    const result = await this.#db.query(
      `INSERT INTO agent_tasks (user_id, username, platform, channel_id, description, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, username, platform, channelId, description]
    );
    return result.insertId;
  }

  async updateStatus(id, status, result = undefined) {
    const done = status === 'done' || status === 'failed';
    await this.#db.query(
      `UPDATE agent_tasks
       SET status = ?, result = ?, completed_at = ${done ? 'NOW()' : 'NULL'}
       WHERE id = ?`,
      [status, result ?? null, id]
    );
  }

  async findAll(limit = 50) {
    return this.#db.query(
      `SELECT id, user_id, username, platform, channel_id, description, status, created_at, completed_at
       FROM agent_tasks ORDER BY created_at DESC LIMIT ?`,
      [Math.min(Math.max(Number(limit) || 50, 1), 200)]
    );
  }

  async findOne(id) {
    return this.#db.queryOne(
      `SELECT * FROM agent_tasks WHERE id = ? LIMIT 1`,
      [id]
    );
  }
}

module.exports = TaskRepository;
