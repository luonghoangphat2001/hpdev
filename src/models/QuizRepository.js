'use strict';

/**
 * Repository for Learning Hub quiz results, user scores, streaks, and leaderboards.
 */
class QuizRepository {
  /** @type {import('./Database')} */
  #db;

  /** @param {import('./Database')} db */
  constructor(db) {
    this.#db = db;
  }

  /**
   * Record a quiz attempt result and update user stats.
   * @param {{ userId: string, username: string, wordId: number, quizType: string, isCorrect: boolean, scoreDelta: number }} data
   */
  async recordResult({ userId, username, wordId, quizType, isCorrect, scoreDelta }) {
    const today = new Date().toISOString().slice(0, 10);
    const correctVal = isCorrect ? 1 : 0;

    await this.#db.query(
      `INSERT INTO learning_quiz_result
       (item_id, user_id, username, quiz_type, is_correct, score_delta)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [wordId, userId, username, quizType, correctVal, scoreDelta]
    );

    const stats = await this.getUserStats(userId);
    let newStreak = 1;
    if (stats && stats.last_active_date) {
      const lastDate = new Date(stats.last_active_date);
      const now = new Date(today);
      const diffDays = Math.round((now - lastDate) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        newStreak = (stats.streak_days || 0) + 1;
      } else if (diffDays === 0) {
        newStreak = stats.streak_days || 1;
      }
    }

    await this.#db.query(
      `INSERT INTO user_quiz_stats (user_id, username, total_score, correct_count, wrong_count, streak_days, last_active_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         total_score = GREATEST(0, total_score + VALUES(total_score)),
         correct_count = correct_count + IF(VALUES(correct_count) > 0, 1, 0),
         wrong_count = wrong_count + IF(VALUES(wrong_count) > 0, 1, 0),
         streak_days = VALUES(streak_days),
         last_active_date = VALUES(last_active_date)`,
      [
        userId,
        username,
        Math.max(0, scoreDelta),
        isCorrect ? 1 : 0,
        isCorrect ? 0 : 1,
        newStreak,
        today,
      ]
    );

    return this.getUserStats(userId);
  }

  /** @param {string} userId */
  async getUserStats(userId) {
    return this.#db.queryOne('SELECT * FROM user_quiz_stats WHERE user_id = ?', [userId]);
  }

  /** @param {number} [limit=10] */
  async getLeaderboard(limit = 10) {
    const l = Math.min(Math.max(Number(limit) || 10, 1), 50);
    return this.#db.query(
      `SELECT user_id, username, total_score, correct_count, wrong_count, streak_days, last_active_date
       FROM user_quiz_stats
       ORDER BY total_score DESC, correct_count DESC
       LIMIT ?`,
      [l]
    );
  }

  /**
   * Get user quiz history for a specific word.
   * @param {string} userId
   * @param {number} wordId
   */
  async getWordHistory(userId, wordId) {
    return this.#db.query(
      `SELECT * FROM learning_quiz_result
       WHERE user_id = ? AND item_id = ?
       ORDER BY id DESC LIMIT 5`,
      [userId, wordId]
    );
  }

  /** Aggregate correct/wrong attempts for adaptive selection. */
  async getItemPerformance(userId, itemIds = []) {
    const ids = [...new Set((itemIds || []).map(Number).filter(Number.isInteger))];
    if (!ids.length) return [];
    return this.#db.query(
      `SELECT item_id,
              SUM(is_correct = 1) AS correct_count,
              SUM(is_correct = 0) AS wrong_count,
              COUNT(*) AS attempt_count,
              MAX(created_at) AS last_attempt_at
       FROM learning_quiz_result
       WHERE user_id = ? AND item_id IN (${ids.map(() => '?').join(', ')})
       GROUP BY item_id`,
      [userId, ...ids]
    );
  }
}

module.exports = QuizRepository;
