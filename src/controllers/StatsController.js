'use strict';

const { memoryCache, CacheConfig } = require('@cache');

/**
 * Returns aggregate usage statistics (admin only) with server-side caching.
 */
class StatsController {
  /** @type {import('../models/ConversationRepository')} */
  #conversationRepo;

  /** @param {import('../models/ConversationRepository')} conversationRepo */
  constructor(conversationRepo) {
    this.#conversationRepo = conversationRepo;
    this.get = this.get.bind(this);
  }

  async get(_req, res) {
    const key = CacheConfig.KEYS.statsSummary();
    const stats = await memoryCache.wrap(key, CacheConfig.TTL.STATS, async () => {
      return this.#conversationRepo.getStats();
    });
    res.json(stats);
  }
}

module.exports = StatsController;
