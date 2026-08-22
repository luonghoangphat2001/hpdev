'use strict';

const { unpackItems } = require('../services/learning/ContentNormalizer');

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
   */
  async findLearnings(categoryIdOrSlug, type = null) {
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

    return this.#db.query(
      `SELECT l.*, c.slug AS category_slug, c.name AS category_name,
              COUNT(i.id) AS item_count,
              SUM(CASE WHEN i.is_active = 1 THEN 1 ELSE 0 END) AS active_item_count
       FROM learning l
       JOIN learning_category c ON c.id = l.category_id
       LEFT JOIN learning_item i ON i.learning_id = l.id AND i.type = l.type
       WHERE ${where.join(' AND ')}
       GROUP BY l.id
       ORDER BY l.sort_order ASC, l.topic_no ASC, l.id ASC`,
      params
    );
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

  /** Append every answered quiz/exam item; history is never overwritten. */
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
    return valid.length;
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
