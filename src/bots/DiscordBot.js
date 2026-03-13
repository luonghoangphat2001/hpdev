'use strict';

const { Client, GatewayIntentBits } = require('discord.js');

/**
 * Discord bot.
 * Handles slash commands and natural-language "đần" triggers,
 * including model-switching commands.
 */
class DiscordBot {
  /** @type {Client} */
  #client;
  /** @type {import('../services/AIService')} */
  #aiService;
  /** @type {import('../models/ConfigRepository')} */
  #configRepo;

  /**
   * @param {import('../services/AIService')} aiService
   * @param {import('../models/ConfigRepository')} configRepo
   */
  constructor(aiService, configRepo) {
    this.#aiService  = aiService;
    this.#configRepo = configRepo;

    this.#client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.#registerHandlers();
  }

  #registerHandlers() {
    this.#client.on('clientReady', () => {
      console.log(`Discord bot online: ${this.#client.user.tag}`);
    });
    this.#client.on('interactionCreate', (i)   => this.#handleInteraction(i));
    this.#client.on('messageCreate',     (msg) => this.#handleMessage(msg));
  }

  /** Handle /ai slash command */
  async #handleInteraction(interaction) {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'ai') return;

    await interaction.deferReply();
    try {
      const text = await this.#aiService.chat({
        channelId: interaction.channelId,
        userId:    interaction.user.id,
        username:  interaction.user.username,
        prompt:    interaction.options.getString('prompt'),
      });
      await interaction.editReply(this.#truncate(text));
    } catch (err) {
      console.error('[Discord] Interaction error:', err);
      await interaction.editReply(`❌ Error: ${err.message}`);
    }
  }

  /** Handle plain messages that mention "đần" */
  async #handleMessage(msg) {
    if (msg.author.bot)         return;
    if (!/đần/i.test(msg.content)) return;

    const lower = msg.content.toLowerCase();

    // ── Model-switching commands ──────────────────────────
    if (/chuy[eê]n\s+model\s+sang\s+claude/i.test(lower)) {
      await this.#configRepo.set('active_model', 'claude');
      return msg.reply('✅ Đã chuyển sang **Claude**! Tao sẽ dùng Claude từ giờ 🧠');
    }

    if (/chuy[eê]n\s+model\s+sang\s+gemini/i.test(lower)) {
      await this.#configRepo.set('active_model', 'gemini');
      return msg.reply('✅ Đã chuyển sang **Gemini**! Tao sẽ dùng Gemini từ giờ ✨');
    }

    if (/chuy[eê]n\s+model\s+sang\s+(chatgpt|gpt|openai)/i.test(lower)) {
      await this.#configRepo.set('active_model', 'chatgpt');
      return msg.reply('✅ Đã chuyển sang **ChatGPT**! Tao sẽ dùng GPT từ giờ 🤖');
    }

    if (/đang\s+d[uù]ng\s+model\s+g[ìi]/i.test(lower) ||
        /model\s+(hi[eệ]n\s+t[aạ]i|đang\s+d[uù]ng)/i.test(lower)) {
      const labels = { claude: 'Claude 🧠', chatgpt: 'ChatGPT 🤖', gemini: 'Gemini ✨' };
      const current = this.#configRepo.get('active_model') || 'gemini';
      return msg.reply(`🤖 Tao đang dùng **${labels[current] ?? current}** nè!`);
    }

    // ── Regular AI query ──────────────────────────────────
    const prompt = msg.content
      .replace(/^(ê|này|hey|oi|ơi|à)?\s*đần\s*(ơi|oi|à|ê|hey)?\s*/i, '')
      .trim();

    if (!prompt) return msg.reply('Gọi tao hả? Hỏi gì đi 😤');

    msg.channel.sendTyping();
    try {
      const text = await this.#aiService.chat({
        channelId: msg.channelId,
        userId:    msg.author.id,
        username:  msg.author.username,
        prompt,
      });
      await msg.reply(this.#truncate(text));
    } catch (err) {
      console.error('[Discord] Message error:', err);
      await msg.reply(`❌ Error: ${err.message}`);
    }
  }

  /** @param {string} text @param {number} [max] */
  #truncate(text, max = 2000) {
    return text.length > max ? text.substring(0, max - 3) + '...' : text;
  }

  start() {
    this.#client.login(process.env.DISCORD_TOKEN);
  }
}

module.exports = DiscordBot;
