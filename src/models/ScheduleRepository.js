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
   * Admin dashboard list across users/platforms.
   * @param {{ limit?: number, includeInactive?: boolean }} [opts]
   */
  async findAll(opts = {}) {
    const limit = Math.min(Math.max(Number(opts.limit || 200), 1), 500);
    const where = opts.includeInactive ? '' : 'WHERE is_active = 1';
    return this.#db.query(
      `SELECT * FROM schedules ${where} ORDER BY remind_at ASC LIMIT ?`,
      [limit]
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
   * Get schedules due within a future window for advance notifications.
   * Finds schedules whose remind_at is between nowStr and thresholdStr (exclusive/inclusive),
   * and whose advance notify flag has not been set yet.
   *
   * @param {string} nowStr       current time "YYYY-MM-DD HH:MM:SS"
   * @param {string} thresholdStr future time "YYYY-MM-DD HH:MM:SS"
   * @param {string} notifyCol    column name: 'notified_1h' | 'notified_30m'
   */
  async findAdvance(nowStr, thresholdStr, notifyCol) {
    return this.#db.query(
      `SELECT * FROM schedules
       WHERE remind_at > ? AND remind_at <= ? AND is_active = 1 AND \`${notifyCol}\` = 0`,
      [nowStr, thresholdStr]
    );
  }

  /**
   * Mark an advance notification as sent.
   * @param {number} id
   * @param {string} notifyCol  'notified_1h' | 'notified_30m'
   */
  async markNotified(id, notifyCol) {
    await this.#db.query(
      `UPDATE schedules SET \`${notifyCol}\` = 1 WHERE id = ?`,
      [id]
    );
  }

  /**
   * After firing, either advance the next time (recurring) or deactivate (one-shot).
   * Recurring schedules also reset advance-notification flags for the next cycle.
   * @param {number} id
   * @param {string|null} nextRemindAt  ISO datetime string or null
   */
  async markFired(id, nextRemindAt = null) {
    if (nextRemindAt) {
      await this.#db.query(
        `UPDATE schedules SET remind_at = ?, notified_1h = 0, notified_30m = 0 WHERE id = ?`,
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
    // Also reset advance-notification flags and reactivate if editing remind_at
    if (changes.remindAt) {
      sets.push('notified_1h = 0', 'notified_30m = 0', 'is_active = 1');
    }
    params.push(id, userId);
    const result = await this.#db.query(
      `UPDATE schedules SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  /**
   * Admin update from dashboard.
   * @param {number} id
   * @param {{ userId?: string, username?: string, platform?: string, channelId?: string, title?: string, remindAt?: string, repeatType?: string, isActive?: number }} changes
   */
  async updateAdmin(id, changes) {
    const sets = [];
    const params = [];
    const map = [
      ['userId', 'user_id'],
      ['username', 'username'],
      ['platform', 'platform'],
      ['channelId', 'channel_id'],
      ['title', 'title'],
      ['remindAt', 'remind_at'],
      ['repeatType', 'repeat_type'],
      ['isActive', 'is_active'],
    ];
    for (const [key, column] of map) {
      if (changes[key] !== undefined) {
        sets.push(`${column} = ?`);
        params.push(changes[key]);
      }
    }
    if (changes.remindAt !== undefined) {
      sets.push('notified_1h = 0', 'notified_30m = 0');
    }
    if (!sets.length) return false;
    params.push(id);
    const result = await this.#db.query(
      `UPDATE schedules SET ${sets.join(', ')} WHERE id = ?`,
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
   * Update all active schedules matching a keyword for a user.
   * Only non-null fields in `changes` are applied.
   * @param {string} userId
   * @param {string} platform
   * @param {string} keyword
   * @param {{ remindAtTimePart?: string }} changes  remindAtTimePart = "HH:MM:SS" (keeps each row's date)
   * @returns {Promise<number>} affected rows
   */
  async updateTimeByKeyword(userId, platform, keyword, newTimePart) {
    const result = await this.#db.query(
      `UPDATE schedules
       SET remind_at = CONCAT(DATE(remind_at), ' ', ?)
       WHERE user_id = ? AND platform = ? AND is_active = 1 AND title LIKE ?`,
      [newTimePart, userId, platform, `%${keyword}%`]
    );
    return result.affectedRows;
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

  /** @param {number} id */
  async deleteAdmin(id) {
    const result = await this.#db.query('DELETE FROM schedules WHERE id = ?', [id]);
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
