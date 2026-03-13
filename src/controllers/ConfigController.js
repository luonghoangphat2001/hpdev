'use strict';

/**
 * Handles reading and updating the bot configuration (admin only).
 */
class ConfigController {
  /** @type {import('../models/ConfigRepository')} */
  #configRepo;

  /** @param {import('../models/ConfigRepository')} configRepo */
  constructor(configRepo) {
    this.#configRepo = configRepo;
    this.get    = this.get.bind(this);
    this.update = this.update.bind(this);
  }

  get(_req, res) {
    res.json({
      active_model:          this.#configRepo.get('active_model'),
      discord_active_model:  this.#configRepo.get('discord_active_model'),
      telegram_active_model: this.#configRepo.get('telegram_active_model'),
      system_prompt:         this.#configRepo.get('system_prompt'),
      claude_base_url:       this.#configRepo.get('claude_base_url'),
      gemini_model:          this.#configRepo.get('gemini_model'),
      claude_model:          this.#configRepo.get('claude_model'),
      chatgpt_model:         this.#configRepo.get('chatgpt_model'),
    });
  }

  async update(req, res) {
    const {
      active_model, discord_active_model, telegram_active_model,
      system_prompt, claude_base_url, gemini_model, claude_model, chatgpt_model,
    } = req.body;
    if (active_model)                   await this.#configRepo.set('active_model', active_model);
    if (discord_active_model)           await this.#configRepo.set('discord_active_model', discord_active_model);
    if (telegram_active_model)          await this.#configRepo.set('telegram_active_model', telegram_active_model);
    if (system_prompt !== undefined)    await this.#configRepo.set('system_prompt', system_prompt);
    if (claude_base_url !== undefined)  await this.#configRepo.set('claude_base_url', claude_base_url);
    if (gemini_model)                   await this.#configRepo.set('gemini_model', gemini_model);
    if (claude_model)                   await this.#configRepo.set('claude_model', claude_model);
    if (chatgpt_model)                  await this.#configRepo.set('chatgpt_model', chatgpt_model);
    res.json({ ok: true });
  }
}

module.exports = ConfigController;
