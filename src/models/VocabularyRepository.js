'use strict';

/** Vocabulary repository backed by the Learning Hub. */
class VocabularyRepository {
  #db;

  constructor(db) { this.#db = db; }

  async findTopics() {
    return this.#db.query(`
      SELECT l.id, l.topic_no, l.name, l.is_active, l.sort_order,
             COUNT(i.id) AS word_count,
             SUM(CASE WHEN i.is_active = 1 THEN 1 ELSE 0 END) AS active_word_count
      FROM learning l
      LEFT JOIN learning_item i ON i.learning_id = l.id AND i.type = 'vocabulary'
      WHERE l.category_id = 2 AND l.type = 'vocabulary' AND l.topic_no IS NOT NULL
      GROUP BY l.id ORDER BY l.sort_order ASC, l.topic_no ASC`);
  }

  async findTopicByNo(topicNo) {
    return this.#db.queryOne(
      `SELECT id, topic_no, name, is_active, sort_order FROM learning
       WHERE category_id = 2 AND type = 'vocabulary' AND topic_no = ?`, [topicNo]);
  }

  async findTopicByName(name) {
    return this.#db.queryOne(
      `SELECT id, topic_no, name, is_active, sort_order FROM learning
       WHERE category_id = 2 AND type = 'vocabulary'
         AND LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1`, [name]);
  }

  async updateTopic(topicNo, changes) {
    const sets = [];
    const params = [];
    if (changes.name !== undefined) { sets.push('name = ?'); params.push(changes.name); }
    if (changes.isActive !== undefined) { sets.push('is_active = ?'); params.push(changes.isActive ? 1 : 0); }
    if (changes.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(Number(changes.sortOrder) || topicNo); }
    if (!sets.length) return false;
    const result = await this.#db.query(
      `UPDATE learning SET ${sets.join(', ')}
       WHERE category_id = 2 AND type = 'vocabulary' AND topic_no = ?`, [...params, topicNo]);
    return result.affectedRows > 0;
  }

  #itemSelect(extra = '') {
    return `
      SELECT i.id, i.learning_id AS topic_id, l.topic_no, l.name AS topic_name,
             i.title AS word, i.title, i.level, i.is_active,
             JSON_UNQUOTE(JSON_EXTRACT(i.content, '$.meaning')) AS meaning,
             JSON_UNQUOTE(JSON_EXTRACT(i.content, '$.pronunciation')) AS pronunciation,
             JSON_UNQUOTE(JSON_EXTRACT(i.content, '$.example')) AS example,
             JSON_UNQUOTE(JSON_EXTRACT(i.content, '$.note')) AS note,
             CASE WHEN EXISTS (
               SELECT 1 FROM learning_delivery_log d
               WHERE d.item_id = i.id AND d.status = 'sent'
             ) THEN 1 ELSE 0 END AS is_sent
      FROM learning_item i JOIN learning l ON l.id = i.learning_id ${extra}`;
  }

  async findWords(topicNo = null, opts = {}) {
    const params = [];
    const where = ["i.type = 'vocabulary'"];
    if (topicNo) { where.push('l.topic_no = ?'); params.push(topicNo); }
    if (!opts.includeInactive) where.push('i.is_active = 1');
    params.push(Math.min(Math.max(Number(opts.limit || 500), 1), 1000));
    return this.#db.query(`${this.#itemSelect(`WHERE ${where.join(' AND ')}`)} ORDER BY l.topic_no, i.id LIMIT ?`, params);
  }

  async findMissingPronunciationWords() {
    return this.#db.query(`${this.#itemSelect(`WHERE i.type = 'vocabulary' AND i.is_active = 1
      AND (JSON_EXTRACT(i.content, '$.pronunciation') IS NULL
        OR TRIM(JSON_UNQUOTE(JSON_EXTRACT(i.content, '$.pronunciation'))) = '')`)} ORDER BY i.id`);
  }

  async updatePronunciationsBatch(updates) {
    for (const item of updates || []) {
      await this.#db.query(`UPDATE learning_item SET content = JSON_SET(COALESCE(content, JSON_OBJECT()), '$.pronunciation', ?)
        WHERE id = ? AND type = 'vocabulary'`, [item.pronunciation, item.id]);
    }
    return (updates || []).length;
  }

  async createWord(data) {
    const topicNo = data.topicNo ?? data.topic_no;
    const topic = await this.findTopicByNo(topicNo);
    if (!topic) throw new Error(`Topic ${topicNo} not found`);
    const result = await this.#db.query(`INSERT INTO learning_item
      (learning_id, type, title, level, content, is_active, created_by)
      VALUES (?, 'vocabulary', ?, 'medium', JSON_OBJECT(
        'word', ?, 'meaning', ?, 'pronunciation', ?, 'example', ?, 'note', ?), ?, 'admin')`,
      [topic.id, data.word, data.word, data.meaning, data.pronunciation || '', data.example || '', data.note || '', data.isActive === undefined ? 1 : (data.isActive ? 1 : 0)]);
    return result.insertId;
  }

  async findWordsByTopicAndWord(topicNo, word) {
    return this.#db.query(`${this.#itemSelect(`WHERE i.type = 'vocabulary' AND l.topic_no = ?
      AND LOWER(TRIM(i.title)) = LOWER(TRIM(?))`)} ORDER BY i.id`, [topicNo, word]);
  }

  async upsertWordByTopicAndWord(data) {
    const matches = await this.findWordsByTopicAndWord(data.topicNo, data.word);
    if (!matches.length) return { action: 'created', ids: [await this.createWord(data)] };
    for (const row of matches) await this.updateWord(row.id, data);
    return { action: 'updated', ids: matches.map((row) => row.id) };
  }

  async updateWord(id, data) {
    const sets = [];
    const params = [];
    const topicNo = data.topicNo ?? data.topic_no;
    if (topicNo !== undefined) {
      const topic = await this.findTopicByNo(Number(topicNo));
      if (!topic) throw new Error(`Topic ${topicNo} not found`);
      sets.push('learning_id = ?'); params.push(topic.id);
    }
    if (data.word !== undefined) { sets.push('title = ?'); params.push(data.word); }
    if (data.isActive !== undefined) { sets.push('is_active = ?'); params.push(data.isActive ? 1 : 0); }
    for (const field of ['meaning', 'pronunciation', 'example', 'note']) {
      if (data[field] !== undefined) {
        sets.push(`content = JSON_SET(COALESCE(content, JSON_OBJECT()), '$.${field}', ?)`);
        params.push(data[field] || '');
      }
    }
    if (!sets.length) return false;
    const result = await this.#db.query(`UPDATE learning_item SET ${sets.join(', ')} WHERE id = ? AND type = 'vocabulary'`, [...params, id]);
    return result.affectedRows > 0;
  }

  async deleteWord(id) {
    const result = await this.#db.query("DELETE FROM learning_item WHERE id = ? AND type = 'vocabulary'", [id]);
    return result.affectedRows > 0;
  }

  async pickUnsentWords(topicNo, limit) {
    return this.#db.query(`${this.#itemSelect(`WHERE i.type = 'vocabulary' AND l.topic_no = ?
      AND l.is_active = 1 AND i.is_active = 1
      AND NOT EXISTS (SELECT 1 FROM learning_delivery_log d WHERE d.item_id = i.id AND d.status = 'sent')`)} ORDER BY i.id LIMIT ?`, [topicNo, limit]);
  }

  async findLogs(dateStr = null, limit = 100) {
    const params = [];
    const where = ['1 = 1'];
    if (dateStr) { where.push('d.sent_date = ?'); params.push(dateStr); }
    params.push(Math.min(Math.max(Number(limit || 100), 1), 300));
    return this.#db.query(`${this.#itemSelect(`JOIN learning_delivery_log d ON d.item_id = i.id WHERE ${where.join(' AND ')}`)} ORDER BY d.created_at DESC LIMIT ?`, params);
  }

  async logSend(wordId, topicId, sentDate, data) {
    await this.#db.query(`INSERT INTO learning_delivery_log
      (legacy_id, item_id, topic_no, sent_date, sent_at, status, error, channel_id)
      SELECT NULL, i.id, l.topic_no, ?, ?, ?, ?, ? FROM learning_item i JOIN learning l ON l.id = i.learning_id
      WHERE i.id = ? AND i.type = 'vocabulary'`,
      [sentDate, data.sentAt || null, data.status, data.error || null, data.channelId || null, wordId]);
  }
}

module.exports = VocabularyRepository;
