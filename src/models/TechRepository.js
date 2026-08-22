'use strict';

/**
 * Repository for Tech Learning stacks, topics, questions, and user progress.
 */
class TechRepository {
  /** @type {import('./Database')} */
  #db;

  /** @param {import('./Database')} db */
  constructor(db) {
    this.#db = db;
  }

  /**
   * Find all tech stacks with question counts and user progress.
   * @param {number|null} [userId]
   */
  async findStacks(userId = null) {
    if (userId) {
      return this.#db.query(
        `SELECT s.*,
          COUNT(DISTINCT q.id) AS total_questions,
          SUM(CASE WHEN p.status = 'mastered' THEN 1 ELSE 0 END) AS mastered_count,
          SUM(CASE WHEN p.status = 'learning' THEN 1 ELSE 0 END) AS learning_count,
          SUM(CASE WHEN p.status = 'review_needed' THEN 1 ELSE 0 END) AS review_count,
          SUM(CASE WHEN p.is_bookmarked = 1 THEN 1 ELSE 0 END) AS bookmarked_count
         FROM tech_stacks s
         LEFT JOIN tech_questions q ON q.stack_id = s.id AND q.is_active = 1
         LEFT JOIN tech_user_progress p ON p.question_id = q.id AND p.user_id = ?
         WHERE s.is_active = 1
         GROUP BY s.id
         ORDER BY s.sort_order ASC, s.id ASC`,
        [userId]
      );
    }

    return this.#db.query(
      `SELECT s.*,
        COUNT(DISTINCT q.id) AS total_questions
       FROM tech_stacks s
       LEFT JOIN tech_questions q ON q.stack_id = s.id AND q.is_active = 1
       WHERE s.is_active = 1
       GROUP BY s.id
       ORDER BY s.sort_order ASC, s.id ASC`
    );
  }

  /** @param {string} slug */
  async findStackBySlug(slug) {
    return this.#db.queryOne('SELECT * FROM tech_stacks WHERE slug = ? LIMIT 1', [slug.toLowerCase().trim()]);
  }

  /** @param {number} stackId */
  async findTopics(stackId) {
    return this.#db.query(
      `SELECT t.*, COUNT(q.id) AS question_count
       FROM tech_topics t
       LEFT JOIN tech_questions q ON q.topic_id = t.id AND q.is_active = 1
       WHERE t.stack_id = ? AND t.is_active = 1
       GROUP BY t.id
       ORDER BY t.sort_order ASC, t.id ASC`,
      [stackId]
    );
  }

  /**
   * @param {number} stackId
   * @param {string} topicName
   * @param {number} [sortOrder]
   */
  async findOrCreateTopic(stackId, topicName, sortOrder = 0) {
    const trimmed = topicName.trim();
    const existing = await this.#db.queryOne(
      'SELECT * FROM tech_topics WHERE stack_id = ? AND LOWER(TRIM(topic_name)) = LOWER(?) LIMIT 1',
      [stackId, trimmed]
    );
    if (existing) return existing;

    const result = await this.#db.query(
      'INSERT INTO tech_topics (stack_id, topic_name, sort_order) VALUES (?, ?, ?)',
      [stackId, trimmed, sortOrder]
    );
    return { id: result.insertId, stack_id: stackId, topic_name: trimmed, sort_order: sortOrder };
  }

  /**
   * Find questions with optional filtering and user progress tracking.
   * @param {{
   *   stackSlug?: string,
   *   topicId?: number,
   *   level?: string,
   *   status?: string,
   *   isBookmarked?: boolean,
   *   search?: string,
   *   limit?: number,
   *   offset?: number,
   *   userId?: number|null,
   *   includeInactive?: boolean,
   * }} opts
   */
  async findQuestions(opts = {}) {
    const params = [];
    const where = [];

    if (opts.stackSlug) {
      where.push('s.slug = ?');
      params.push(opts.stackSlug.toLowerCase().trim());
    }

    if (opts.topicId) {
      where.push('q.topic_id = ?');
      params.push(Number(opts.topicId));
    }

    if (opts.level && opts.level !== 'all') {
      where.push('q.level = ?');
      params.push(opts.level.toLowerCase().trim());
    }

    if (!opts.includeInactive) {
      where.push('q.is_active = 1');
    }

    if (opts.search) {
      const searchPattern = `%${opts.search.trim()}%`;
      where.push('(q.title LIKE ? OR q.question LIKE ? OR q.tags LIKE ?)');
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const userId = opts.userId || 0;

    if (opts.status && opts.status !== 'all') {
      if (opts.status === 'unlearned') {
        where.push('(p.status IS NULL OR p.status = "unlearned")');
      } else {
        where.push('p.status = ?');
        params.push(opts.status);
      }
    }

    if (opts.isBookmarked) {
      where.push('p.is_bookmarked = 1');
    }

    const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(Number(opts.limit || 50), 1), 500);
    const offset = Math.max(Number(opts.offset || 0), 0);

    const queryParams = [userId, ...params, limit, offset];

    return this.#db.query(
      `SELECT q.*,
              s.slug AS stack_slug, s.name AS stack_name, s.icon AS stack_icon,
              t.topic_name,
              COALESCE(p.status, 'unlearned') AS user_status,
              COALESCE(p.is_bookmarked, 0) AS is_bookmarked,
              p.personal_notes,
              p.last_practiced_at
       FROM tech_questions q
       JOIN tech_stacks s ON s.id = q.stack_id
       LEFT JOIN tech_topics t ON t.id = q.topic_id
       LEFT JOIN tech_user_progress p ON p.question_id = q.id AND p.user_id = ?
       ${sqlWhere}
       ORDER BY q.sort_order ASC, q.id ASC
       LIMIT ? OFFSET ?`,
      queryParams
    );
  }

  /**
   * Count total questions matching filters.
   * @param {object} opts
   */
  async countQuestions(opts = {}) {
    const params = [];
    const where = [];

    if (opts.stackSlug) {
      where.push('s.slug = ?');
      params.push(opts.stackSlug.toLowerCase().trim());
    }

    if (opts.topicId) {
      where.push('q.topic_id = ?');
      params.push(Number(opts.topicId));
    }

    if (opts.level && opts.level !== 'all') {
      where.push('q.level = ?');
      params.push(opts.level.toLowerCase().trim());
    }

    if (!opts.includeInactive) {
      where.push('q.is_active = 1');
    }

    if (opts.search) {
      const searchPattern = `%${opts.search.trim()}%`;
      where.push('(q.title LIKE ? OR q.question LIKE ? OR q.tags LIKE ?)');
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const userId = opts.userId || 0;

    if (opts.status && opts.status !== 'all') {
      if (opts.status === 'unlearned') {
        where.push('(p.status IS NULL OR p.status = "unlearned")');
      } else {
        where.push('p.status = ?');
        params.push(opts.status);
      }
    }

    if (opts.isBookmarked) {
      where.push('p.is_bookmarked = 1');
    }

    const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const row = await this.#db.queryOne(
      `SELECT COUNT(q.id) AS total
       FROM tech_questions q
       JOIN tech_stacks s ON s.id = q.stack_id
       LEFT JOIN tech_topics t ON t.id = q.topic_id
       LEFT JOIN tech_user_progress p ON p.question_id = q.id AND p.user_id = ?
       ${sqlWhere}`,
      [userId, ...params]
    );

    return Number(row?.total || 0);
  }

  /**
   * Find single question by id.
   * @param {number} id
   * @param {number|null} [userId]
   */
  async findQuestionById(id, userId = null) {
    return this.#db.queryOne(
      `SELECT q.*,
              s.slug AS stack_slug, s.name AS stack_name, s.icon AS stack_icon,
              t.topic_name,
              COALESCE(p.status, 'unlearned') AS user_status,
              COALESCE(p.is_bookmarked, 0) AS is_bookmarked,
              p.personal_notes,
              p.last_practiced_at
       FROM tech_questions q
       JOIN tech_stacks s ON s.id = q.stack_id
       LEFT JOIN tech_topics t ON t.id = q.topic_id
       LEFT JOIN tech_user_progress p ON p.question_id = q.id AND p.user_id = ?
       WHERE q.id = ?
       LIMIT 1`,
      [userId || 0, id]
    );
  }

  /**
   * Find existing question titles by stack to prevent duplicate AI generation or imports.
   * @param {number} stackId
   */
  async findExistingTitlesByStack(stackId) {
    const rows = await this.#db.query(
      'SELECT id, title, level, tags FROM tech_questions WHERE stack_id = ? AND is_active = 1',
      [stackId]
    );
    return rows;
  }

  /**
   * @param {{
   *   stackId: number,
   *   topicId?: number|null,
   *   title: string,
   *   question: string,
   *   quickAnswer: string,
   *   detailedAnswer: string,
   *   codeExample?: string|null,
   *   interviewTips?: string|null,
   *   practicalTips?: string|null,
   *   level?: string,
   *   tags?: string|null,
   *   createdBy?: string,
   *   sortOrder?: number
   * }} data
   */
  async createQuestion(data) {
    const result = await this.#db.query(
      `INSERT INTO tech_questions
        (stack_id, topic_id, title, question, quick_answer, detailed_answer, code_example, interview_tips, practical_tips, level, tags, created_by, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.stackId,
        data.topicId || null,
        data.title,
        data.question,
        data.quickAnswer,
        data.detailedAnswer,
        data.codeExample || null,
        data.interviewTips || null,
        data.practicalTips || null,
        data.level || 'junior',
        data.tags || null,
        data.createdBy || 'system',
        data.sortOrder || 0,
      ]
    );
    return result.insertId;
  }

  /**
   * @param {number} id
   * @param {object} data
   */
  async updateQuestion(id, data) {
    const sets = [];
    const params = [];

    const fieldMap = {
      stackId: 'stack_id',
      topicId: 'topic_id',
      title: 'title',
      question: 'question',
      quickAnswer: 'quick_answer',
      detailedAnswer: 'detailed_answer',
      codeExample: 'code_example',
      interviewTips: 'interview_tips',
      practicalTips: 'practical_tips',
      level: 'level',
      tags: 'tags',
      sortOrder: 'sort_order',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${col} = ?`);
        params.push(data[key] === '' ? null : data[key]);
      }
    }

    if (data.isActive !== undefined) {
      sets.push('is_active = ?');
      params.push(data.isActive ? 1 : 0);
    }

    if (!sets.length) return false;
    params.push(id);

    const result = await this.#db.query(
      `UPDATE tech_questions SET ${sets.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  /** @param {number} id */
  async deleteQuestion(id) {
    const result = await this.#db.query('DELETE FROM tech_questions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Upsert user study progress.
   * @param {number} userId
   * @param {number} questionId
   * @param {{ status?: string, isBookmarked?: boolean|number, personalNotes?: string }} data
   */
  async upsertUserProgress(userId, questionId, data) {
    const existing = await this.#db.queryOne(
      'SELECT id, status, is_bookmarked, personal_notes FROM tech_user_progress WHERE user_id = ? AND question_id = ?',
      [userId, questionId]
    );

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!existing) {
      await this.#db.query(
        `INSERT INTO tech_user_progress (user_id, question_id, status, is_bookmarked, personal_notes, last_practiced_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          questionId,
          data.status || 'learning',
          data.isBookmarked !== undefined ? (data.isBookmarked ? 1 : 0) : 0,
          data.personalNotes || null,
          now,
        ]
      );
      return true;
    }

    const sets = ['last_practiced_at = ?'];
    const params = [now];

    if (data.status !== undefined) {
      sets.push('status = ?');
      params.push(data.status);
    }
    if (data.isBookmarked !== undefined) {
      sets.push('is_bookmarked = ?');
      params.push(data.isBookmarked ? 1 : 0);
    }
    if (data.personalNotes !== undefined) {
      sets.push('personal_notes = ?');
      params.push(data.personalNotes || null);
    }

    params.push(userId, questionId);
    const result = await this.#db.query(
      `UPDATE tech_user_progress SET ${sets.join(', ')} WHERE user_id = ? AND question_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  /**
   * Find questions by topic/title pair to deduplicate imports.
   * @param {number} stackId
   * @param {string} title
   */
  async findQuestionsByStackAndTitle(stackId, title) {
    return this.#db.query(
      `SELECT q.*
       FROM tech_questions q
       WHERE q.stack_id = ? AND LOWER(TRIM(q.title)) = LOWER(TRIM(?))`,
      [stackId, title]
    );
  }

  /**
   * Import helper: update matching row or insert a new one.
   * @param {object} data
   */
  async upsertQuestion(data) {
    const matches = await this.findQuestionsByStackAndTitle(data.stackId, data.title);
    if (!matches.length) {
      const id = await this.createQuestion(data);
      return { action: 'created', id };
    }

    await this.updateQuestion(matches[0].id, data);
    return { action: 'updated', id: matches[0].id };
  }
}

module.exports = TechRepository;
