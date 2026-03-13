'use strict';

/**
 * Handles one-shot AI chat requests from the web dashboard.
 */
class ChatController {
  /** @type {import('../services/AIService')} */
  #aiService;

  /** @param {import('../services/AIService')} aiService */
  constructor(aiService) {
    this.#aiService = aiService;
    this.handle = this.handle.bind(this);
  }

  async handle(req, res) {
    const { message, model } = req.body;
    if (!message) return res.status(400).json({ error: 'No message' });

    try {
      const response = await this.#aiService.chatOnce(
        [{ role: 'user', content: message }],
        model || null
      );
      res.json({ response, model: model || 'default' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = ChatController;
