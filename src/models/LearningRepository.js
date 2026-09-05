'use strict';

const { unpackItems } = require('@services/learning/ContentNormalizer');

/**
 * Unified repository managing the 4-table Learning Hub architecture:
 * 1. learning_category (Tech, English...)
 * 2. learning (Stacks, Topics 1-50, Skills...)
 * 3. learning_item (Questions, Words, Quizzes, Tasks...)
 * 4. learning_meta_data (Progress, Submissions, Scores, Feedback...)
 */
class LearningRepository {
  /** @type {import('./Database')} */
  #db;

  /** @param {import('./Database')} db */
  constructor(db) {
    this.#db = db;
  }

  // ─── 1. CATEGORIES ───────────────────────────────────────────
  async findCategories() {
    return this.#db.query(
      'SELECT * FROM learning_category WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
    );
  }

  async findCategoryBySlug(slug) {
    return this.#db.queryOne(
      'SELECT * FROM learning_category WHERE slug = ? AND is_active = 1',
      [slug]
    );
  }

  // ─── 2. LEARNINGS (Stacks, Topics, Skills) ───────────────────
  /**
   * @param {string|number} categoryIdOrSlug
   * @param {string|null} [type]
   * @param {string} [username]
   */
  async findLearnings(categoryIdOrSlug, type = null, username = '') {
    const params = [];
    const where = ['l.is_active = 1'];

    if (typeof categoryIdOrSlug === 'number' || !isNaN(Number(categoryIdOrSlug))) {
      where.push('l.category_id = ?');
      params.push(Number(categoryIdOrSlug));
    } else {
      where.push('c.slug = ?');
      params.push(categoryIdOrSlug);
    }

    if (type) {
      where.push('l.type = ?');
      params.push(type);
    }

    let selectExtra = '';
    let joinExtra = '';
    const userParams = [];

    if (username) {
      userParams.push(username);
      selectExtra = `,
        COUNT(DISTINCT CASE WHEN m.status = 'mastered' AND i.is_active = 1 THEN i.id END) AS mastered_item_count,
        COUNT(DISTINCT CASE WHEN m.status = 'studying' AND i.is_active = 1 THEN i.id END) AS studying_item_count
      `;
      joinExtra = 'LEFT JOIN learning_meta_data m ON m.item_id = i.id AND m.username = ? AND m.meta_key = "progress"';
    }

    const rows = await this.#db.query(
      `SELECT l.*, c.slug AS category_slug, c.name AS category_name,
              COUNT(DISTINCT i.id) AS item_count,
              COUNT(DISTINCT CASE WHEN i.is_active = 1 THEN i.id END) AS active_item_count
              ${selectExtra}
       FROM learning l
       JOIN learning_category c ON c.id = l.category_id
       LEFT JOIN learning_item i ON i.learning_id = l.id AND i.type = l.type
       ${joinExtra}
       WHERE ${where.join(' AND ')}
       GROUP BY l.id
       ORDER BY l.sort_order ASC, l.topic_no ASC, l.id ASC`,
      [...userParams, ...params]
    );

    return rows.map((r) => {
      const activeCount = Number(r.active_item_count || 0);
      const masteredCount = Number(r.mastered_item_count || 0);
      const studyingCount = Number(r.studying_item_count || 0);
      const isCompleted = activeCount > 0 && masteredCount >= activeCount;
      const progressPercent = activeCount > 0 ? Number(((masteredCount / activeCount) * 100).toFixed(1)) : 0;
      return {
        ...r,
        active_item_count: activeCount,
        mastered_item_count: masteredCount,
        studying_item_count: studyingCount,
        is_completed: isCompleted,
        progress_percent: progressPercent,
      };
    });
  }

  async findLearningBySlug(slug) {
    return this.#db.queryOne(
      `SELECT l.*, c.slug AS category_slug, c.name AS category_name
       FROM learning l
       JOIN learning_category c ON c.id = l.category_id
       WHERE l.slug = ? AND l.is_active = 1`,
      [slug]
    );
  }

  async findLearningById(id) {
    return this.#db.queryOne(
      `SELECT l.*, c.slug AS category_slug, c.name AS category_name
       FROM learning l
       JOIN learning_category c ON c.id = l.category_id
       WHERE l.id = ?`,
      [id]
    );
  }

  async updateLearning(id, data) {
    const sets = [];
    const params = [];
    if (data.name !== undefined) {
      sets.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      sets.push('description = ?');
      params.push(data.description);
    }
    if (data.isActive !== undefined) {
      sets.push('is_active = ?');
      params.push(data.isActive ? 1 : 0);
    }
    if (data.is_active !== undefined && data.isActive === undefined) {
      sets.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }
    if (!sets.length) return false;
    params.push(id);
    const result = await this.#db.query(`UPDATE learning SET ${sets.join(', ')} WHERE id = ?`, params);

    return result.affectedRows > 0;
  }

  // ─── 3. LEARNING ITEMS ───────────────────────────────────────
  /**
   * @param {object} [filters]
   */
  async findItems(filters = {}) {
    const where = [];
    const params = [];

    if (!filters.includeInactive) {
      where.push('i.is_active = 1');
    }

    if (filters.learningSlug) {
      where.push('l.slug = ?');
      params.push(filters.learningSlug);
    }

    if (filters.learningId) {
      where.push('i.learning_id = ?');
      params.push(Number(filters.learningId));
    }

    if (filters.categorySlug) {
      where.push('c.slug = ?');
      params.push(filters.categorySlug);
    }
    if (filters.type) {
      where.push('i.type = ?');
      params.push(filters.type);
    }

    if (filters.topicNo) {
      where.push('l.topic_no = ?');
      params.push(Number(filters.topicNo));
    }

    if (filters.level) {
      where.push('i.level = ?');
      params.push(filters.level);
    }

    if (filters.search) {
      where.push('(i.title LIKE ? OR i.prompt LIKE ? OR i.tags LIKE ?)');
      const q = `%${filters.search.trim()}%`;
      params.push(q, q, q);
    }

    if (filters.isSent !== undefined) {
      where.push('i.is_sent = ?');
      params.push(filters.isSent ? 1 : 0);
    }

    // Bookmark / Progress filter
    const username = filters.username || '';
    if (filters.isBookmarked) {
      where.push('m.is_bookmarked = 1');
    }

    if (filters.status) {
      where.push('COALESCE(m.status, "unstudied") = ?');
      params.push(filters.status);
    }

    const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(Number(filters.limit || 500), 1), 1000);
    const offset = Math.max(Number(filters.offset || 0), 0);

    const rows = await this.#db.query(
      `SELECT i.*, 
              l.slug AS learning_slug, l.name AS learning_name, l.topic_no, l.icon AS learning_icon,
              c.slug AS category_slug, c.name AS category_name,
              m.status, m.is_bookmarked, m.score, m.user_submission, m.ai_feedback, m.last_activity_at
       FROM learning_item i
       JOIN learning l ON l.id = i.learning_id
       JOIN learning_category c ON c.id = l.category_id
       LEFT JOIN learning_meta_data m ON m.item_id = i.id AND m.username = ? AND m.meta_key = 'progress'
       ${sqlWhere}
       ORDER BY l.sort_order ASC, l.topic_no ASC, i.id ASC
       LIMIT ? OFFSET ?`,
      [username, ...params, limit, offset]
    );

    return rows.map((r) => this.#parseItemRow(r));
  }

  async findItemById(id, username = '') {
    const row = await this.#db.queryOne(
      `SELECT i.*, 
              l.slug AS learning_slug, l.name AS learning_name, l.topic_no, l.icon AS learning_icon,
              c.slug AS category_slug, c.name AS category_name,
              m.status, m.is_bookmarked, m.score, m.user_submission, m.ai_feedback, m.last_activity_at
       FROM learning_item i
       JOIN learning l ON l.id = i.learning_id
       JOIN learning_category c ON c.id = l.category_id
       LEFT JOIN learning_meta_data m ON m.item_id = i.id AND m.username = ? AND m.meta_key = 'progress'
       WHERE i.id = ?`,
      [username || '', id]
    );
    return row ? this.#parseItemRow(row) : null;
  }

  /**
   * Load active theory items eligible for a practice exam. Randomisation and
   * level balancing happen in the service layer so the policy is testable and
   * does not depend on a database-specific RAND() implementation.
   */
  async findPracticeExamPool(filters = {}) {
    const where = ['i.is_active = 1', 'l.is_active = 1'];
    const params = [];
    const learningSlugs = Array.isArray(filters.learningSlugs) ? filters.learningSlugs.filter(Boolean) : [];
    const types = Array.isArray(filters.types) && filters.types.length
      ? filters.types.filter(Boolean)
      : ['tech_question', 'reading', 'writing', 'quiz', 'ielts'];

    if (filters.categorySlug) {
      where.push('c.slug = ?');
      params.push(filters.categorySlug);
    }
    if (filters.level) {
      where.push('i.level = ?');
      params.push(filters.level);
    }
    if (learningSlugs.length) {
      where.push(`l.slug IN (${learningSlugs.map(() => '?').join(', ')})`);
      params.push(...learningSlugs);
    }
    if (types.length) {
      where.push(`i.type IN (${types.map(() => '?').join(', ')})`);
      params.push(...types);
    }

    const rows = await this.#db.query(
      `SELECT i.*, l.slug AS learning_slug, l.name AS learning_name,
              l.topic_no, c.slug AS category_slug, c.name AS category_name
       FROM learning_item i
       JOIN learning l ON l.id = i.learning_id
       JOIN learning_category c ON c.id = l.category_id
       WHERE ${where.join(' AND ')}
       ORDER BY i.id ASC
       LIMIT 5000`,
      params
    );

    return rows.map((row) => this.#parseItemRow(row));
  }

  /** Aggregate a user's item-level answer history for adaptive selection. */
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
      [String(userId), ...ids]
    );
  }

  /** Append every answered quiz/exam item; update learning progress and topic completion. */
  async recordItemAttempts(userId, username, quizType, attempts = []) {
    const valid = (Array.isArray(attempts) ? attempts : [])
      .map((attempt) => ({
        itemId: Number(attempt.item_id ?? attempt.itemId ?? attempt.id),
        isCorrect: [true, 1, '1', 'true'].includes(attempt.is_correct ?? attempt.isCorrect),
      }))
      .filter((attempt) => Number.isInteger(attempt.itemId) && attempt.itemId > 0);
    if (!valid.length) return 0;

    const placeholders = valid.map(() => '(?, ?, ?, ?, ?, 0)').join(', ');
    const params = valid.flatMap((attempt) => [
      attempt.itemId,
      String(userId),
      String(username),
      String(quizType),
      attempt.isCorrect ? 1 : 0,
    ]);
    await this.#db.query(
      `INSERT INTO learning_quiz_result
       (item_id, user_id, username, quiz_type, is_correct, score_delta)
       VALUES ${placeholders}`,
      params
    );

    // Update user learning progress for each item
    if (username) {
      for (const attempt of valid) {
        if (attempt.isCorrect) {
          await this.#db.query(
            `INSERT INTO learning_meta_data (item_id, username, meta_key, status, score, last_activity_at)
             VALUES (?, ?, 'progress', 'mastered', 10, NOW())
             ON DUPLICATE KEY UPDATE
               status = 'mastered',
               score = COALESCE(score, 10),
               last_activity_at = NOW()`,
            [attempt.itemId, username]
          );
        } else {
          await this.#db.query(
            `INSERT INTO learning_meta_data (item_id, username, meta_key, status, score, last_activity_at)
             VALUES (?, ?, 'progress', 'studying', 0, NOW())
             ON DUPLICATE KEY UPDATE
               status = IF(status = 'mastered', 'mastered', 'studying'),
               last_activity_at = NOW()`,
            [attempt.itemId, username]
          );
        }
      }

      // Check if any topics have now been completed
      const itemIds = valid.map((a) => a.itemId);
      if (itemIds.length) {
        try {
          const items = await this.#db.query(
            `SELECT DISTINCT learning_id FROM learning_item WHERE id IN (${itemIds.map(() => '?').join(', ')})`,
            itemIds
          );
          for (const item of items) {
            if (item.learning_id) {
              await this.checkTopicCompletion(item.learning_id, username);
            }
          }
        } catch {
          // Non-blocking topic completion check
        }
      }
    }

    return valid.length;
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

  /**
   * Find paginated learning history for users/admin.
   * @param {object} [filters]
   */
  async findLearningHistory(filters = {}) {
    const where = [];
    const params = [];

    if (filters.userId) {
      where.push('r.user_id = ?');
      params.push(String(filters.userId));
    }
    if (filters.username) {
      where.push('r.username = ?');
      params.push(String(filters.username));
    }
    if (filters.quizType || filters.type) {
      where.push('r.quiz_type = ?');
      params.push(filters.quizType || filters.type);
    }
    if (filters.isCorrect !== undefined && filters.isCorrect !== null && filters.isCorrect !== '') {
      where.push('r.is_correct = ?');
      params.push([true, 1, '1', 'true'].includes(filters.isCorrect) ? 1 : 0);
    }
    if (filters.learningSlug) {
      where.push('l.slug = ?');
      params.push(filters.learningSlug);
    }
    if (filters.categorySlug) {
      where.push('c.slug = ?');
      params.push(filters.categorySlug);
    }
    if (filters.startDate) {
      where.push('r.created_at >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      where.push('r.created_at <= ?');
      params.push(filters.endDate);
    }
    if (filters.search) {
      where.push('(i.title LIKE ? OR l.name LIKE ?)');
      const q = `%${filters.search.trim()}%`;
      params.push(q, q);
    }

    const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(Number(filters.limit || 20), 1), 100);
    const offset = Math.max(Number(filters.offset || 0), 0);

    const rows = await this.#db.query(
      `SELECT r.id, r.item_id, r.user_id, r.username, r.quiz_type, r.is_correct, r.score_delta, r.created_at,
              i.title AS item_title, i.type AS item_type, i.level AS item_level,
              l.id AS learning_id, l.name AS learning_name, l.slug AS learning_slug, l.topic_no,
              c.name AS category_name, c.slug AS category_slug,
              m.status AS current_status
       FROM learning_quiz_result r
       JOIN learning_item i ON i.id = r.item_id
       JOIN learning l ON l.id = i.learning_id
       JOIN learning_category c ON c.id = l.category_id
       LEFT JOIN learning_meta_data m ON m.item_id = i.id AND m.username = r.username AND m.meta_key = 'progress'
       ${sqlWhere}
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return rows.map((r) => ({
      ...r,
      is_correct: Boolean(r.is_correct),
    }));
  }

  /**
   * Count learning history rows matching filters.
   * @param {object} [filters]
   */
  async countLearningHistory(filters = {}) {
    const where = [];
    const params = [];

    if (filters.userId) {
      where.push('r.user_id = ?');
      params.push(String(filters.userId));
    }
    if (filters.username) {
      where.push('r.username = ?');
      params.push(String(filters.username));
    }
    if (filters.quizType || filters.type) {
      where.push('r.quiz_type = ?');
      params.push(filters.quizType || filters.type);
    }
    if (filters.isCorrect !== undefined && filters.isCorrect !== null && filters.isCorrect !== '') {
      where.push('r.is_correct = ?');
      params.push([true, 1, '1', 'true'].includes(filters.isCorrect) ? 1 : 0);
    }
    if (filters.learningSlug) {
      where.push('l.slug = ?');
      params.push(filters.learningSlug);
    }
    if (filters.categorySlug) {
      where.push('c.slug = ?');
      params.push(filters.categorySlug);
    }
    if (filters.startDate) {
      where.push('r.created_at >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      where.push('r.created_at <= ?');
      params.push(filters.endDate);
    }
    if (filters.search) {
      where.push('(i.title LIKE ? OR l.name LIKE ?)');
      const q = `%${filters.search.trim()}%`;
      params.push(q, q);
    }

    const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const row = await this.#db.queryOne(
      `SELECT COUNT(*) AS total
       FROM learning_quiz_result r
       JOIN learning_item i ON i.id = r.item_id
       JOIN learning l ON l.id = i.learning_id
       JOIN learning_category c ON c.id = l.category_id
       ${sqlWhere}`,
      params
    );

    return row ? Number(row.total) : 0;
  }

  /**
   * Get learning summary statistics for a user account.
   * @param {string} userId
   * @param {string} username
   */
  async getUserLearningSummary(userId, username) {
    const safeUserId = String(userId || '');
    const safeUsername = String(username || '');

    // Quiz result attempts aggregate
    const attemptStats = await this.#db.queryOne(
      `SELECT COUNT(*) AS total_attempts,
              SUM(is_correct = 1) AS correct_count,
              SUM(is_correct = 0) AS wrong_count,
              COUNT(DISTINCT item_id) AS distinct_items_practiced,
              MAX(created_at) AS last_attempt_at
       FROM learning_quiz_result
       WHERE user_id = ? OR username = ?`,
      [safeUserId, safeUsername]
    );

    const totalAttempts = attemptStats ? Number(attemptStats.total_attempts || 0) : 0;
    const correctCount = attemptStats ? Number(attemptStats.correct_count || 0) : 0;
    const wrongCount = attemptStats ? Number(attemptStats.wrong_count || 0) : 0;
    const accuracyRate = totalAttempts > 0 ? Number(((correctCount / totalAttempts) * 100).toFixed(1)) : 0;

    // Item progress stats from learning_meta_data
    const progressStats = await this.#db.queryOne(
      `SELECT SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) AS mastered_count,
              SUM(CASE WHEN status = 'studying' THEN 1 ELSE 0 END) AS studying_count,
              COUNT(DISTINCT item_id) AS total_tracked_items
       FROM learning_meta_data
       WHERE username = ? AND meta_key = 'progress'`,
      [safeUsername]
    );

    // Completed topics count
    const completedTopicsRow = await this.#db.queryOne(
      `SELECT COUNT(DISTINCT item_id) AS completed_topics
       FROM learning_meta_data
       WHERE username = ? AND meta_key = 'topic_progress' AND status = 'completed'`,
      [safeUsername]
    );

    // User quiz stats (streak, total score)
    const quizStats = await this.#db.queryOne(
      `SELECT total_score, correct_count, wrong_count, streak_days, last_active_date
       FROM user_quiz_stats
       WHERE user_id = ? OR username = ?`,
      [safeUserId, safeUsername]
    );

    // Category breakdown
    const categoryStats = await this.#db.query(
      `SELECT c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
              COUNT(DISTINCT i.id) AS total_items,
              COUNT(DISTINCT CASE WHEN m.status = 'mastered' THEN i.id END) AS mastered_items,
              COUNT(DISTINCT CASE WHEN m.status = 'studying' THEN i.id END) AS studying_items
       FROM learning_category c
       JOIN learning l ON l.category_id = c.id AND l.is_active = 1
       JOIN learning_item i ON i.learning_id = l.id AND i.is_active = 1
       LEFT JOIN learning_meta_data m ON m.item_id = i.id AND m.username = ? AND m.meta_key = 'progress'
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.id ASC`,
      [safeUsername]
    );

    const categories = Array.isArray(categoryStats) ? categoryStats.map((c) => {
      const total = Number(c.total_items || 0);
      const mastered = Number(c.mastered_items || 0);
      return {
        ...c,
        total_items: total,
        mastered_items: mastered,
        studying_items: Number(c.studying_items || 0),
        progress_percent: total > 0 ? Number(((mastered / total) * 100).toFixed(1)) : 0,
      };
    }) : [];

    return {
      total_attempts: totalAttempts,
      correct_count: correctCount,
      wrong_count: wrongCount,
      accuracy_rate: accuracyRate,
      distinct_items_practiced: attemptStats ? Number(attemptStats.distinct_items_practiced || 0) : 0,
      last_attempt_at: attemptStats?.last_attempt_at || null,
      mastered_count: progressStats ? Number(progressStats.mastered_count || 0) : 0,
      studying_count: progressStats ? Number(progressStats.studying_count || 0) : 0,
      completed_topics_count: completedTopicsRow ? Number(completedTopicsRow.completed_topics || 0) : 0,
      total_score: quizStats ? Number(quizStats.total_score || 0) : 0,
      streak_days: quizStats ? Number(quizStats.streak_days || 0) : 0,
      last_active_date: quizStats?.last_active_date || null,
      categories,
    };
  }

  /**
   * @param {{
   *   learningId: number,
   *   type: string,
   *   title: string,
   *   prompt?: string,
   *   level?: string,
   *   content?: object|string,
   *   sampleSolution?: object|string,
   *   tags?: string,
   *   isSent?: number,
   *   createdBy?: string
   * }} data
   */
  async createItem(data) {
    const contentJson = typeof data.content === 'object' ? JSON.stringify(data.content) : (data.content || null);
    const solutionJson = typeof data.sampleSolution === 'object' ? JSON.stringify(data.sampleSolution) : (data.sampleSolution || null);

    const result = await this.#db.query(
      `INSERT INTO learning_item (learning_id, type, title, prompt, level, content, sample_solution, tags, is_sent, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.learningId,
        data.type,
        data.title,
        data.prompt || null,
        data.level || 'medium',
        contentJson,
        solutionJson,
        data.tags || null,
        data.isSent ? 1 : 0,
        data.createdBy || 'ai'
      ]
    );
    return result.insertId;
  }

  /**
   * @param {number} id
   * @param {object} changes
   */
  async updateItem(id, changes) {
    const sets = [];
    const params = [];

    if (changes.title !== undefined) {
      sets.push('title = ?');
      params.push(changes.title);
    }
    if (changes.prompt !== undefined) {
      sets.push('prompt = ?');
      params.push(changes.prompt);
    }
    if (changes.level !== undefined) {
      sets.push('level = ?');
      params.push(changes.level);
    }
    if (changes.content !== undefined) {
      sets.push('content = ?');
      params.push(typeof changes.content === 'object' ? JSON.stringify(changes.content) : changes.content);
    }
    if (changes.sampleSolution !== undefined) {
      sets.push('sample_solution = ?');
      params.push(typeof changes.sampleSolution === 'object' ? JSON.stringify(changes.sampleSolution) : changes.sampleSolution);
    }
    // Accept the snake_case shape used by the HTTP API as well as the
    // camelCase shape used internally.
    if (changes.sample_solution !== undefined && changes.sampleSolution === undefined) {
      sets.push('sample_solution = ?');
      params.push(typeof changes.sample_solution === 'object' ? JSON.stringify(changes.sample_solution) : changes.sample_solution);
    }
    if (changes.tags !== undefined) {
      sets.push('tags = ?');
      params.push(changes.tags);
    }
    if (changes.isSent !== undefined) {
      sets.push('is_sent = ?');
      params.push(changes.isSent ? 1 : 0);
    }
    if (changes.isActive !== undefined) {
      sets.push('is_active = ?');
      params.push(changes.isActive ? 1 : 0);
    }
    if (changes.is_active !== undefined && changes.isActive === undefined) {
      sets.push('is_active = ?');
      params.push(changes.is_active ? 1 : 0);
    }

    if (!sets.length) return false;
    params.push(id);

    const result = await this.#db.query(
      `UPDATE learning_item SET ${sets.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async deleteItem(id) {
    const result = await this.#db.query('DELETE FROM learning_item WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // ─── 4. METADATA & PROGRESS ──────────────────────────────────
  /**
   * Upsert progress / metadata for a user on an item.
   * @param {number} itemId
   * @param {string} username
   * @param {{
   *   metaKey?: string,
   *   status?: string,
   *   isBookmarked?: boolean|number,
   *   score?: number,
   *   userSubmission?: string,
   *   aiFeedback?: object|string
   * }} data
   */
  async upsertMetadata(itemId, username, data) {
    const metaKey = data.metaKey || 'progress';
    const feedbackJson = typeof data.aiFeedback === 'object' ? JSON.stringify(data.aiFeedback) : (data.aiFeedback || null);
    const bookmarkedVal = data.isBookmarked !== undefined ? (data.isBookmarked ? 1 : 0) : null;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await this.#db.query(
      `INSERT INTO learning_meta_data (item_id, username, meta_key, status, is_bookmarked, score, user_submission, ai_feedback, last_activity_at)
       VALUES (?, ?, ?, ?, COALESCE(?, 0), ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         status = COALESCE(VALUES(status), status),
         is_bookmarked = COALESCE(VALUES(is_bookmarked), is_bookmarked),
         score = COALESCE(VALUES(score), score),
         user_submission = COALESCE(VALUES(user_submission), user_submission),
         ai_feedback = COALESCE(VALUES(ai_feedback), ai_feedback),
         last_activity_at = VALUES(last_activity_at)`,
      [
        itemId,
        username,
        metaKey,
        data.status || 'unstudied',
        bookmarkedVal,
        data.score ?? null,
        data.userSubmission || null,
        feedbackJson,
        now
      ]
    );
    return true;
  }

  /**
   * Get leaderboard by aggregating scores in learning_meta_data.
   * @param {number} [limit=10]
   */
  async getLeaderboard(limit = 10) {
    return this.#db.query(
      `SELECT username,
              COUNT(*) AS total_quizzes,
              ROUND(AVG(score), 1) AS avg_score,
              MAX(score) AS best_score,
              MAX(last_activity_at) AS last_played
       FROM learning_meta_data
       WHERE meta_key LIKE 'quiz_result%' AND score IS NOT NULL
       GROUP BY username
       ORDER BY avg_score DESC, total_quizzes DESC
       LIMIT ?`,
      [Math.max(1, limit)]
    );
  }

  /**
   * Append one quiz attempt without overwriting previous attempts.
   * Progress/bookmark metadata remains an upsert; quiz attempts are history.
   */
  async insertQuizResult(itemId, username, data = {}) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const metaKey = `quiz_result_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const feedbackJson = typeof data.aiFeedback === 'object'
      ? JSON.stringify(data.aiFeedback)
      : (data.aiFeedback || null);

    const result = await this.#db.query(
      `INSERT INTO learning_meta_data
       (item_id, username, meta_key, status, score, user_submission, ai_feedback, last_activity_at)
       VALUES (?, ?, ?, 'completed', ?, ?, ?, ?)`,
      [itemId, username, metaKey, data.score ?? null, data.userSubmission || null, feedbackJson, now]
    );

    return result.insertId;
  }

  // ─── 5. DISCORD & NOTIFICATION HELPERS ────────────────────────
  /**
   * Pick unsent items for a given type / topic.
   * @param {string} type
   * @param {number|null} [topicNo]
   * @param {number} [count=5]
   */
  async pickUnsentItems(type, topicNo = null, count = 5) {
    const where = ['i.is_active = 1', 'i.is_sent = 0', 'i.type = ?'];
    const params = [type];

    if (topicNo) {
      where.push('l.topic_no = ?');
      params.push(Number(topicNo));
    }

    const rows = await this.#db.query(
      `SELECT i.*, l.name AS learning_name, l.topic_no
       FROM learning_item i
       JOIN learning l ON l.id = i.learning_id
       WHERE ${where.join(' AND ')}
       ORDER BY l.topic_no ASC, i.id ASC
       LIMIT ?`,
      [...params, Math.max(1, count)]
    );

    return rows.map((r) => this.#parseItemRow(r));
  }

  async markItemSent(id) {
    await this.#db.query('UPDATE learning_item SET is_sent = 1 WHERE id = ?', [id]);
  }

  // ─── Helper Row Parser ───────────────────────────────────────
  #parseItemRow(row) {
    if (!row) return null;
    const parsed = {
      ...row,
      content: typeof row.content === 'string' ? this.#safeJson(row.content) : (row.content || {}),
      sample_solution: typeof row.sample_solution === 'string' ? this.#safeJson(row.sample_solution) : (row.sample_solution || {}),
      ai_feedback: typeof row.ai_feedback === 'string' ? this.#safeJson(row.ai_feedback) : (row.ai_feedback || null),
    };

    // Older AI saves could put the whole generated array in one row.
    // Normalize that row at the read boundary so the dashboard never prints raw JSON.
    const legacyItems = unpackItems([{
      title: parsed.title,
      prompt: parsed.prompt,
      content: parsed.content,
      level: parsed.level,
      sample_solution: parsed.sample_solution,
      tags: parsed.tags,
    }]);
    const first = legacyItems[0];
    if (first && (parsed.title === 'Generated Content' || first.title !== parsed.title)) {
      return {
        ...parsed,
        title: first.title,
        prompt: first.prompt,
        level: first.level,
        content: first.content,
        sample_solution: first.sample_solution,
        tags: first.tags,
        legacy_items: legacyItems,
      };
    }

    return parsed;
  }

  #safeJson(str) {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }
}

module.exports = LearningRepository;
