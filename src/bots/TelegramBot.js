'use strict';

const { Telegraf } = require('telegraf');

/**
 * Telegram bot.
 * Responds to /ai commands and messages that mention "đần".
 */
class TelegramBot {
  /** @type {Telegraf|null} */
  #bot = null;
  /** @type {import('../services/AIService')} */
  #aiService;

  /** @param {import('../services/AIService')} aiService */
  constructor(aiService) {
    this.#aiService = aiService;
  }

  start() {
    const token = process.env.TELEGRAM_TOKEN;
    if (!token) {
      console.log('TELEGRAM_TOKEN not set, skipping Telegram bot');
      return;
    }

    this.#bot = new Telegraf(token);
    this.#registerHandlers();
    this.#bot.launch();
    console.log('Telegram bot online');

    process.once('SIGINT',  () => this.#bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.#bot.stop('SIGTERM'));
  }

  #registerHandlers() {
    this.#bot.start((ctx) => {
      ctx.reply("Ê đần đây! Gọi tao bằng /ai <câu hỏi> hoặc cứ nhắc tới 'đần' là tao trả lời 😤");
    });

    this.#bot.command('ai', async (ctx) => {
      const prompt = ctx.message.text.replace(/^\/ai\s*/i, '').trim();
      if (!prompt) return ctx.reply('Hỏi gì đi đần ơi 😑');
      await this.#handleAI(ctx, prompt);
    });

    this.#bot.hears(/đần/i, async (ctx) => {
      const prompt = ctx.message.text
        .replace(/^(ê|này|hey|oi|ơi|à)?\s*đần\s*(ơi|oi|à|ê|hey)?\s*/i, '')
        .trim();
      if (!prompt) return ctx.reply('Gọi tao hả? Hỏi gì đi 😤');
      await this.#handleAI(ctx, prompt);
    });
  }

  /** @param {import('telegraf').Context} ctx @param {string} prompt */
  async #handleAI(ctx, prompt) {
    const channelId = String(ctx.chat.id);
    const userId    = String(ctx.from.id);
    const username  = ctx.from.username || ctx.from.first_name || 'user';

    const thinking = await ctx.reply('⏳ Đang xử lý...');
    try {
      const response = await this.#aiService.chat({ channelId, userId, username, prompt });
      await ctx.telegram.deleteMessage(ctx.chat.id, thinking.message_id);
      await ctx.reply(response);
    } catch (err) {
      console.error('[Telegram] Error:', err);
      await ctx.telegram.deleteMessage(ctx.chat.id, thinking.message_id);
      await ctx.reply('❌ Lỗi: ' + err.message);
    }
  }
}

module.exports = TelegramBot;
