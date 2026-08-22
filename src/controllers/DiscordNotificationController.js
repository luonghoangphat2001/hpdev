'use strict';

class DiscordNotificationController {
  #service;

  constructor(service) {
    this.#service = service;
    this.create = this.create.bind(this);
  }

  async create(req, res) {
    try {
      const result = await this.#service.enqueue(req.body);
      return res.status(result.duplicate ? 200 : 202).json({
        ok: true,
        notificationId: result.id,
        duplicate: result.duplicate,
      });
    } catch (error) {
      if (error instanceof TypeError) {
        return res.status(400).json({ error: error.message });
      }
      console.error('[DiscordNotificationController] enqueue failed:', error.message);
      return res.status(500).json({ error: 'Unable to queue notification' });
    }
  }
}

module.exports = DiscordNotificationController;
