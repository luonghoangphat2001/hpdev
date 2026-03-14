'use strict';

/**
 * Repository for user schedules / reminders.
 */
class ScheduleRepository {
  /** @type {import('./Database')} */
  #db;

  /** @param {import('./Database')} db */
  constructor(db) {
    this.#db = db;
  }

  /**
   * @param {{ userId: string, username: string, platform: string, channelId: string, title: string, remindAt: string, repeatType: string }} opts
   */
  async create({ userId, username, platform, channelId, title, remindAt, repeatType }) {
    const result = await this.#db.query(
      `INSERT INTO schedules (user_id, username, platform, channel_id, title, remind_at, repeat_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, platform || 'discord', channelId, title, remindAt, repeatType || 'none']
    );
    return result.insertId;
  }

  /**
   * Get active schedules for a user.
   * @param {string} userId
   * @param {string} platform
   */
  async findByUser(userId, platform) {
    return this.#db.query(
      `SELECT * FROM schedules WHERE user_id = ? AND platform = ? AND is_active = 1 ORDER BY remind_at ASC`,
      [userId, platform]
    );
  }

  /**
   * Get active schedules for a user on a specific date (YYYY-MM-DD).
   * @param {string} userId
   * @param {string} platform
   * @param {string} dateStr  e.g. "2026-03-15"
   */
  async findByDate(userId, platform, dateStr) {
    return this.#db.query(
      `SELECT * FROM schedules
       WHERE user_id = ? AND platform = ? AND is_active = 1
         AND DATE(remind_at) = ?
       ORDER BY remind_at ASC`,
      [userId, platform, dateStr]
    );
  }

  /**
   * Get all schedules due for firing.
   * Uses a Node.js-computed local-timezone datetime string to avoid relying
   * on the MySQL server's own timezone setting.
   * @param {string} nowStr  current local time as "YYYY-MM-DD HH:MM:SS"
   */
  async findUpcoming(nowStr) {
    return this.#db.query(
      `SELECT * FROM schedules WHERE remind_at <= ? AND is_active = 1`,
      [nowStr]
    );
  }

  /**
   * After firing, either advance the next time (recurring) or deactivate (one-shot).
   * @param {number} id
   * @param {string|null} nextRemindAt  ISO datetime string or null
   */
  async markFired(id, nextRemindAt = null) {
    if (nextRemindAt) {
      await this.#db.query(
        `UPDATE schedules SET remind_at = ? WHERE id = ?`,
        [nextRemindAt, id]
      );
    } else {
      await this.#db.query(
        `UPDATE schedules SET is_active = 0 WHERE id = ?`,
        [id]
      );
    }
  }

  /**
   * Update fields of a schedule (only if it belongs to the user).
   * Only non-null fields in `changes` are applied.
   * @param {number} id
   * @param {string} userId
   * @param {{ title?: string, remindAt?: string, repeatType?: string }} changes
   * @returns {Promise<boolean>}
   */
  async update(id, userId, changes) {
    const sets  = [];
    const params = [];
    if (changes.title)      { sets.push('title = ?');       params.push(changes.title); }
    if (changes.remindAt)   { sets.push('remind_at = ?');   params.push(changes.remindAt); }
    if (changes.repeatType) { sets.push('repeat_type = ?'); params.push(changes.repeatType); }
    if (!sets.length) return false;
    params.push(id, userId);
    const result = await this.#db.query(
      `UPDATE schedules SET ${sets.join(', ')} WHERE id = ? AND user_id = ? AND is_active = 1`,
      params
    );
    return result.affectedRows > 0;
  }

  /**
   * Find active schedules of a user where title contains a keyword (case-insensitive).
   * @param {string} userId
   * @param {string} platform
   * @param {string} keyword
   */
  async findByKeyword(userId, platform, keyword) {
    return this.#db.query(
      `SELECT * FROM schedules
       WHERE user_id = ? AND platform = ? AND is_active = 1
         AND title LIKE ?
       ORDER BY remind_at ASC`,
      [userId, platform, `%${keyword}%`]
    );
  }

  /**
   * Delete a schedule (only if it belongs to the user).
   * @param {number} id
   * @param {string} userId
   */
  async delete(id, userId) {
    const result = await this.#db.query(
      `DELETE FROM schedules WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * @param {number} id
   */
  async findById(id) {
    return this.#db.queryOne(`SELECT * FROM schedules WHERE id = ?`, [id]);
  }
}

module.exports = ScheduleRepository;
