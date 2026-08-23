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
         last_activity_at = NOW(),
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

    // Update individual item learning progress
    if (username) {
      if (isCorrect) {
        await this.#db.query(
          `INSERT INTO learning_meta_data (item_id, username, meta_key, status, score, last_activity_at)
           VALUES (?, ?, 'progress', 'mastered', 10, NOW())
           ON DUPLICATE KEY UPDATE
             status = 'mastered',
             score = COALESCE(score, 10),
             last_activity_at = NOW()`,
          [wordId, username]
        );
      } else {
        await this.#db.query(
          `INSERT INTO learning_meta_data (item_id, username, meta_key, status, score, last_activity_at)
           VALUES (?, ?, 'progress', 'studying', 0, NOW())
           ON DUPLICATE KEY UPDATE
             status = IF(status = 'mastered', 'mastered', 'studying'),
             last_activity_at = NOW()`,
          [wordId, username]
        );
      }

      // Check if all words in this item's topic are now mastered
      await this.checkTopicCompletionByItem(wordId, username);
    }

    return this.getUserStats(userId);
  }

  /**
   * Check if all items in the topic containing itemId are mastered.
   * If all active items are mastered, mark the topic as completed.
   * @param {number} itemId
   * @param {string} username
   */
  async checkTopicCompletionByItem(itemId, username) {
    if (!itemId || !username) return false;
    try {
      const item = await this.#db.queryOne('SELECT learning_id FROM learning_item WHERE id = ?', [itemId]);
      if (!item || !item.learning_id) return false;
      return this.checkTopicCompletion(item.learning_id, username);
    } catch {
      return false;
    }
  }

  /**
   * Check and record topic completion if all active items in learningId are mastered.
   * @param {number} learningId
   * @param {string} username
   */
  async checkTopicCompletion(learningId, username) {
    if (!learningId || !username) return false;
    try {
      const totalRow = await this.#db.queryOne(
        'SELECT COUNT(*) AS total FROM learning_item WHERE learning_id = ? AND is_active = 1',
        [learningId]
      );
      const totalActive = totalRow ? Number(totalRow.total) : 0;
      if (totalActive <= 0) return false;

      const masteredRow = await this.#db.queryOne(
        `SELECT COUNT(DISTINCT i.id) AS mastered_count
         FROM learning_item i
         JOIN learning_meta_data m ON m.item_id = i.id AND m.username = ? AND m.meta_key = 'progress' AND m.status = 'mastered'
         WHERE i.learning_id = ? AND i.is_active = 1`,
        [username, learningId]
      );
      const masteredCount = masteredRow ? Number(masteredRow.mastered_count) : 0;

      if (masteredCount >= totalActive) {
        await this.#db.query(
          `INSERT INTO learning_meta_data (item_id, username, meta_key, status, score, last_activity_at)
           VALUES (?, ?, 'topic_progress', 'completed', 100, NOW())
           ON DUPLICATE KEY UPDATE
             status = 'completed',
             last_activity_at = NOW()`,
          [learningId, username]
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
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

  /**
   * Get paginated quiz history for a user.
   * @param {string} userId
   * @param {{ limit?: number, offset?: number }} [opts]
   */
  async getUserQuizHistory(userId, opts = {}) {
    const limit = Math.min(Math.max(Number(opts.limit || 20), 1), 100);
    const offset = Math.max(Number(opts.offset || 0), 0);

    const rows = await this.#db.query(
      `SELECT r.id, r.item_id, r.user_id, r.username, r.quiz_type, r.is_correct, r.score_delta, r.created_at,
              i.title AS word, i.level,
              JSON_UNQUOTE(JSON_EXTRACT(i.content, '$.meaning')) AS meaning,
              l.name AS topic_name, l.topic_no, l.slug AS topic_slug
       FROM learning_quiz_result r
       JOIN learning_item i ON i.id = r.item_id
       JOIN learning l ON l.id = i.learning_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT ? OFFSET ?`,
      [String(userId), limit, offset]
    );

    const countRow = await this.#db.queryOne(
      'SELECT COUNT(*) AS total FROM learning_quiz_result WHERE user_id = ?',
      [String(userId)]
    );

    return {
      history: rows,
      total: countRow ? Number(countRow.total) : 0,
      limit,
      offset,
    };
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
