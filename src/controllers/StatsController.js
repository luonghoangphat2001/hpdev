'use strict';

/**
 * Returns aggregate usage statistics (admin only).
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
    res.json(await this.#conversationRepo.getStats());
  }
}

module.exports = StatsController;
