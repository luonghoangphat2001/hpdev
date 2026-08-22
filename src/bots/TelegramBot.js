'use strict';

const { Telegraf } = require('telegraf');
const BaseBot = require('./BaseBot');
const TaskService = require('../services/scheduler/TaskService');
const { getAliasMap, getProviderOrder } = require('../services/ai/ProviderCatalog');

/**
 * Telegram bot.
 * Responds to /ai, /model, /setmodel commands and "đần" mentions.
 */
class TelegramBot extends BaseBot {
  /** @type {Telegraf|null} */
  #bot = null;

  /** @type {import('../services/OpenClawService')|null} */
  #openClawService = null;

  /** @type {import('../models/ConfigRepository')|null} */
  #configRepo = null;

  /** @type {import('../models/OpenClawRepository')|null} */
  #openClawRepo = null;
  #schedulerService = null;

  /**
   * @param {import('../services/AIService')} aiService
   * @param {import('../services/OpenClawService')|null} [openClawService]
   * @param {import('../models/ConfigRepository')|null} [configRepo]
   * @param {import('../models/OpenClawRepository')|null} [openClawRepo]
   */
  constructor(aiService, openClawService = null, configRepo = null, openClawRepo = null, schedulerService = null) {
    super(aiService, 'telegram');
    this.#openClawService = openClawService;
    this.#configRepo = configRepo;
    this.#openClawRepo = openClawRepo;
    this.#schedulerService = schedulerService;
  }

  start() {
    const token = process.env.TELEGRAM_TOKEN;
    if (!token) {
      console.log('[Telegram] TELEGRAM_TOKEN not set, skipping');
      return;
    }

    this.#bot = new Telegraf(token);
    this.#registerHandlers();
    this.#bot.launch().catch((err) => {
      console.error('[Telegram] Launch error (e.g. conflict with another instance):', err.message);
    });
    console.log('[Telegram] Bot online');

    process.once('SIGINT', () => this.#bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.#bot.stop('SIGTERM'));
  }

  #registerHandlers() {
    this.#bot.start((ctx) => {
      ctx.reply("Ê đần đây! Gọi tao bằng /ai <câu hỏi> hoặc cứ nhắc tới 'đần' là tao trả lời 😤");
    });

    this.#bot.command('ai', async (ctx) => {
      const prompt = ctx.message.text.replace(/^\/ai\s*/i, '').trim();
      const user = ctx.from.username || ctx.from.first_name;
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
      const map = Object.entries(getAliasMap()).reduce((acc, [key, aliases]) => {
        for (const alias of aliases) acc[alias] = key;
        return acc;
      }, {});
      const key = map[arg];
      if (!key) return ctx.reply(`❓ Dùng: /setmodel ${getProviderOrder().join(' | ')}`);
      const label = await this._aiService.setModel(key, this._platform);
      console.log(`[Telegram] /setmodel | user=${ctx.from.id} → ${key}`);
      return ctx.reply(`✅ Đã chuyển sang **${label}**!`, { parse_mode: 'Markdown' });
    });

    this.#bot.hears(/đần/i, async (ctx) => {
      const user = ctx.from.username || ctx.from.first_name;
      console.log(`[Telegram] Message | user=${user}(${ctx.from.id}) chat=${ctx.chat.id} text="${ctx.message.text.slice(0, 100)}"`);
      const reply = (s) => ctx.reply(s, { parse_mode: 'Markdown' });
      const openClawEnabled = this.#configRepo?.get('openclaw_enabled') === 'true';
      const result = await this._handleDanCommand(ctx.message.text, reply);
      if (result.handled) return;
      // When OpenClaw is enabled, route all regular queries through agent loop
      if (openClawEnabled && this.#openClawService) {
        return this.#replyAgentChat(ctx, result.prompt);
      }
      await this.#handleAI(ctx, result.prompt);
    });
  }

  /**
   * Handle a user message via the AI agent loop.
   * AI autonomously decides which OpenClaw tools to call.
   * @param {import('telegraf').Context} ctx
   * @param {string} prompt
   */
  async #replyAgentChat(ctx, prompt) {
    const channelId = String(ctx.chat.id);
    const userId = String(ctx.from.id);
    const username = ctx.from.username || ctx.from.first_name || 'user';

    await this._replyWithThinking({
      createThinking: () => ctx.reply('🤖 Đần đang phân tích và tìm kiếm...'),
      deleteThinking: (thinking) => thinking
        ? ctx.telegram.deleteMessage(ctx.chat.id, thinking.message_id).catch(() => { })
        : Promise.resolve(),
      run: async () => {
        const t0 = Date.now();
        const text = await this._aiService.agentChat({
          channelId,
          userId,
          username,
          prompt,
          platform: this._platform,
          openClawService: this.#openClawService,
          schedulerService: this.#schedulerService,
        });
        console.log(`[Telegram] agentChat done | user=${username} ${Date.now() - t0}ms`);
        return text;
      },
      reply: (text) => ctx.reply(text),
      truncate: (text) => (text.length > 4000 ? text.slice(0, 4000) + '\n...(xem thêm)' : text),
      errorReply: () => '❌ Tao gặp lỗi khi tìm kiếm, thử lại sau nha 😅',
    });
  }

  /** @param {import('telegraf').Context} ctx @param {string} prompt */
  async #handleAI(ctx, prompt) {
    const channelId = String(ctx.chat.id);
    const userId = String(ctx.from.id);
    const username = ctx.from.username || ctx.from.first_name || 'user';

    await this._replyWithThinking({
      createThinking: () => ctx.reply('⏳ Đang xử lý...'),
      deleteThinking: (thinking) => thinking
        ? ctx.telegram.deleteMessage(ctx.chat.id, thinking.message_id).catch(() => { })
        : Promise.resolve(),
      run: async () => {
        const t0 = Date.now();
        const openClawEnabled = this.#configRepo?.get('openclaw_enabled') === 'true';
        const response = openClawEnabled && this.#openClawService
          ? await this._aiService.agentChat({
            channelId,
            userId,
            username,
            prompt,
            platform: this._platform,
            openClawService: this.#openClawService,
            schedulerService: this.#schedulerService,
          })
          : await this._aiService.chat({ channelId, userId, username, prompt, platform: this._platform });
        console.log(`[Telegram] AI reply done | user=${username} ${Date.now() - t0}ms`);
        return response;
      },
      reply: (text) => ctx.reply(text),
      truncate: (text) => (text.length > 4000 ? text.slice(0, 4000) + '\n...(xem thêm)' : text),
      errorReply: (err) => `❌ Lỗi: ${err.message}`,
    });
  }

  /**
   * Async agent chat — ACK immediately, send result when done.
   * @param {import('telegraf').Context} ctx
   * @param {string}  channelId
   * @param {string}  userId
   * @param {string}  username
   * @param {string}  prompt
   */
  async #replyAgentChatAsync(ctx, channelId, userId, username, prompt) {
    const taskId = await new TaskService().createAndRun({
      aiService: this._aiService,
      userId, username,
      platform: this._platform,
      channelId,
      description: prompt.slice(0, 200),
      prompt,
      openClawService: this.#openClawService,
      schedulerService: this.#schedulerService,
      onComplete: async (result, err) => {
        try {
          const text = err
            ? `❌ Tác vụ #${taskId} thất bại: ${err.message}`
            : `✅ Xong! Task #${taskId}\n\n${result || ''}`;
          const MAX = 3900;
          for (let i = 0; i < text.length; i += MAX) {
            await ctx.telegram.sendMessage(channelId, text.slice(i, i + MAX));
          }
        } catch (e) { console.error('[TelegramBot] notify failed:', e.message); }
      },
    });

    await ctx.reply(`🔍 Đang xử lý... Task #${taskId} — mày sẽ được thông báo khi xong!`);
  }
}

module.exports = TelegramBot;
