'use strict';

/**
 * Persists OpenClaw interaction logs for admin monitoring.
 */
class OpenClawRepository {
  /** @type {import('./Database')} */
  #db;

  /** @param {import('./Database')} db */
  constructor(db) {
    this.#db = db;
  }

  /**
   * Save one OpenClaw interaction.
   * @param {{
   *   userId: string, username: string, platform: string, channelId: string,
   *   queryType: 'search'|'crawl', query: string,
   *   resultPreview: string, aiSummary: string,
   * }} opts
   */
  async save({ userId, username, platform, channelId, queryType, query, resultPreview, aiSummary }) {
    await this.#db.query(
      `INSERT INTO openclaw_logs
         (user_id, username, platform, channel_id, query_type, query, result_preview, ai_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, platform, channelId, queryType, query,
       resultPreview.slice(0, 1000), aiSummary.slice(0, 2000)]
    );
  }

  /**
   * Return recent logs, newest first.
   * @param {number} [limit]
   * @param {number} [offset]
   * @returns {Promise<any[]>}
   */
  async findRecent(limit = 50, offset = 0) {
    return this.#db.query(
      `SELECT * FROM openclaw_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  /** @returns {Promise<number>} */
  async count() {
    const row = await this.#db.queryOne('SELECT COUNT(*) AS n FROM openclaw_logs');
    return row?.n ?? 0;
  }
}

module.exports = OpenClawRepository;
