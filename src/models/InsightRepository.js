'use strict';

class InsightRepository {
  #db;

  constructor(db) {
    this.#db = db;
  }

  async upsert(userId, platform, channelId, key, value, source = null) {
    await this.#db.query(
      `INSERT INTO ai_memories (user_id, platform, channel_id, mem_key, mem_value, source)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         mem_value  = VALUES(mem_value),
         source     = VALUES(source),
         updated_at = NOW()`,
      [userId, platform, channelId, key, value, source]
    );
  }

  /** Returns last 20 memories, newest first */
  async findByUser(userId, platform) {
    return this.#db.query(
      `SELECT mem_key, mem_value, source, updated_at
       FROM ai_memories
       WHERE user_id = ? AND platform = ?
       ORDER BY updated_at DESC
       LIMIT 20`,
      [userId, platform]
    );
  }

  async remove(userId, platform, key) {
    await this.#db.query(
      `DELETE FROM ai_memories WHERE user_id = ? AND platform = ? AND mem_key = ?`,
      [userId, platform, key]
    );
  }
}

module.exports = InsightRepository;
