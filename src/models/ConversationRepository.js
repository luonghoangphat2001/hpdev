'use strict';

/**
 * Repository for the conversations table.
 */
class ConversationRepository {
  /** @type {import('./Database')} */
  #db;

  /** @param {import('./Database')} db */
  constructor(db) {
    this.#db = db;
  }

  /**
   * @param {{ channelId: string, userId: string, username: string, role: string, content: string, model: string, tokensIn?: number, tokensOut?: number }} msg
   */
  async save({ channelId, userId, username, role, content, model, tokensIn = 0, tokensOut = 0 }) {
    await this.#db.query(
      'INSERT INTO conversations (channel_id, user_id, username, role, content, model, tokens_in, tokens_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [channelId, userId, username, role, content, model, tokensIn, tokensOut]
    );
  }

  /**
   * Get the most recent messages for a channel, ordered oldest-first.
   * @param {string} channelId
   * @param {number} [limit]
   * @returns {Promise<any[]>}
   */
  async findByChannel(channelId, limit = 10) {
    return this.#db.query(
      'SELECT * FROM (SELECT * FROM conversations WHERE channel_id = ? ORDER BY created_at DESC LIMIT ?) t ORDER BY created_at ASC',
      [channelId, limit]
    );
  }

  /**
   * Paginated full history, newest first.
   * @param {number} [limit]
   * @param {number} [offset]
   * @returns {Promise<any[]>}
   */
  async findAll(limit = 50, offset = 0) {
    return this.#db.query(
      'SELECT * FROM conversations ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  /**
   * @returns {Promise<{ total: number, today: number, byModel: any[], tokensByModel: any[] }>}
   */
  async getStats() {
    const totalRow = await this.#db.queryOne('SELECT COUNT(*) AS c FROM conversations');
    const todayRow = await this.#db.queryOne(
      'SELECT COUNT(*) AS c FROM conversations WHERE DATE(created_at) = CURDATE()'
    );
    const byModel = await this.#db.query(
      'SELECT model, COUNT(*) AS count FROM conversations GROUP BY model'
    );
    const tokensByModel = await this.#db.query(
      'SELECT model, SUM(tokens_in) AS tokens_in, SUM(tokens_out) AS tokens_out FROM conversations WHERE role = "assistant" GROUP BY model'
    );
    return { total: totalRow.c, today: todayRow.c, byModel, tokensByModel };
  }
}

module.exports = ConversationRepository;
