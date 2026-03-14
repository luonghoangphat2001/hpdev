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
    super(aiService, 'telegram');
  }

  start() {
    const token = process.env.TELEGRAM_TOKEN;
    if (!token) {
      console.log('[Telegram] TELEGRAM_TOKEN not set, skipping');
      return;
    }

    this.#bot = new Telegraf(token);
    this.#registerHandlers();
    this.#bot.launch();
    console.log('[Telegram] Bot online');

    process.once('SIGINT',  () => this.#bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.#bot.stop('SIGTERM'));
  }

  #registerHandlers() {
    this.#bot.start((ctx) => {
      ctx.reply("Ê đần đây! Gọi tao bằng /ai <câu hỏi> hoặc cứ nhắc tới 'đần' là tao trả lời 😤");
    });

    this.#bot.command('ai', async (ctx) => {
      const prompt = ctx.message.text.replace(/^\/ai\s*/i, '').trim();
      const user   = ctx.from.username || ctx.from.first_name;
      console.log(`[Telegram] /ai | user=${user}(${ctx.from.id}) chat=${ctx.chat.id} prompt="${prompt.slice(0, 80)}"`);
      if (!prompt) return ctx.reply('Hỏi gì đi đần ơi 😑');
      await this.#handleAI(ctx, prompt);
    });

    this.#bot.command('model', (ctx) => {
      const { label } = this._aiService.currentModel(this._platform);
      console.log(`[Telegram] /model | user=${ctx.from.id} → ${label}`);
      return ctx.reply(`🤖 Tao đang dùng **${label}** nè!`, { parse_mode: 'Markdown' });
    });

    this.#bot.command('setmodel', async (ctx) => {
      const arg = ctx.message.text.replace(/^\/setmodel\s*/i, '').trim().toLowerCase();
      const map = { gemini: 'gemini', claude: 'claude', chatgpt: 'chatgpt', gpt: 'chatgpt', openai: 'chatgpt' };
      const key = map[arg];
      if (!key) return ctx.reply('❓ Dùng: /setmodel gemini | claude | chatgpt');
      const label = await this._aiService.setModel(key, this._platform);
      console.log(`[Telegram] /setmodel | user=${ctx.from.id} → ${key}`);
      return ctx.reply(`✅ Đã chuyển sang **${label}**!`, { parse_mode: 'Markdown' });
    });

    this.#bot.hears(/đần/i, async (ctx) => {
      const user = ctx.from.username || ctx.from.first_name;
      console.log(`[Telegram] Message | user=${user}(${ctx.from.id}) chat=${ctx.chat.id} text="${ctx.message.text.slice(0, 100)}"`);
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

    let thinking = null;
    try {
      thinking = await ctx.reply('⏳ Đang xử lý...');
    } catch (_) { /* rate-limited or permission error — proceed silently */ }

    const deleteThinking = () => thinking
      ? ctx.telegram.deleteMessage(ctx.chat.id, thinking.message_id).catch(() => {})
      : Promise.resolve();

    try {
      const t0       = Date.now();
      const response = await this._aiService.chat({ channelId, userId, username, prompt, platform: this._platform });
      console.log(`[Telegram] AI reply done | user=${username} ${Date.now() - t0}ms`);
      await deleteThinking();
      await ctx.reply(response);
    } catch (err) {
      console.error(`[Telegram] AI error | user=${username}:`, err.message);
      await deleteThinking();
      await ctx.reply('❌ Lỗi: ' + err.message).catch(() => {});
    }
  }
}

module.exports = TelegramBot;
