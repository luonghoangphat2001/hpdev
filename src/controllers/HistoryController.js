'use strict';

/**
 * Returns paginated conversation history (admin only).
 */
class HistoryController {
  /** @type {import('../models/ConversationRepository')} */
  #conversationRepo;

  /** @param {import('../models/ConversationRepository')} conversationRepo */
  constructor(conversationRepo) {
    this.#conversationRepo = conversationRepo;
    this.get = this.get.bind(this);
  }

  async get(req, res) {
    const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    res.json(await this.#conversationRepo.findAll(limit, offset));
  }
}

module.exports = HistoryController;
