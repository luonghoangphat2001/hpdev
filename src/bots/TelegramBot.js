'use strict';

const { Telegraf } = require('telegraf');
const BaseBot = require('./BaseBot');

/**
 * Telegram bot.
 * Responds to /ai, /model, /setmodel commands and "đần" mentions.
 */
class TelegramBot extends BaseBot {
  /** @type {Telegraf|null} */
  #bot = null;

  /** @param {import('../services/AIService')} aiService */
  constructor(aiService) {
    super(aiService);
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

    this.#bot.command('model', (ctx) => {
      const { label } = this._aiService.currentModel();
      return ctx.reply(`🤖 Tao đang dùng **${label}** nè!`, { parse_mode: 'Markdown' });
    });

    this.#bot.command('setmodel', async (ctx) => {
      const arg = ctx.message.text.replace(/^\/setmodel\s*/i, '').trim().toLowerCase();
      const map = { gemini: 'gemini', claude: 'claude', chatgpt: 'chatgpt', gpt: 'chatgpt', openai: 'chatgpt' };
      const key = map[arg];
      if (!key) return ctx.reply('❓ Dùng: /setmodel gemini | claude | chatgpt');
      const label = await this._aiService.setModel(key);
      return ctx.reply(`✅ Đã chuyển sang **${label}**!`, { parse_mode: 'Markdown' });
    });

    this.#bot.hears(/đần/i, async (ctx) => {
      const reply = (s) => ctx.reply(s, { parse_mode: 'Markdown' });
      const result = await this._handleDanCommand(ctx.message.text, reply);
      if (!result.handled) await this.#handleAI(ctx, result.prompt);
    });
  }

  /** @param {import('telegraf').Context} ctx @param {string} prompt */
  async #handleAI(ctx, prompt) {
    const channelId = String(ctx.chat.id);
    const userId    = String(ctx.from.id);
    const username  = ctx.from.username || ctx.from.first_name || 'user';

    const thinking = await ctx.reply('⏳ Đang xử lý...');
    try {
      const response = await this._aiService.chat({ channelId, userId, username, prompt });
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
