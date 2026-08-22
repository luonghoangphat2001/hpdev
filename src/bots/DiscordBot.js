'use strict';

const { Client, GatewayIntentBits, Options, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const BaseBot = require('./BaseBot');
const TaskService = require('../services/scheduler/TaskService');
const TimeUtils = require('../utils/TimeUtils');
const ApprovalCommandService = require('../services/openclaw/ApprovalCommandService');
const CeoCommandService = require('../services/openclaw/CeoCommandService');

/**
 * Discord bot.
 * Handles slash commands and natural-language "đần" triggers.
 */
class DiscordBot extends BaseBot {
  /** @type {Client} */
  #client;

  /** @type {import('../services/scheduler/SchedulerService')|null} */
  #schedulerService = null;

  /** @type {import('../services/openclaw/OpenClawService')|null} */
  #openClawService = null;

  /** @type {import('../services/learning/VocabularyService')|null} */
  #vocabService = null;

  /** @type {import('../services/learning/QuizEngine')|null} */
  #quizEngine = null;

  /** @type {import('../models/ConfigRepository')|null} */
  #configRepo = null;

  /** @type {import('../models/OpenClawRepository')|null} */
  #openClawRepo = null;

  #approvalCommandService = null;
  #ceoCommandService = null;

  /**
   * @param {import('../services/AIService')} aiService
   * @param {import('../services/SchedulerService')} [schedulerService]
   * @param {import('../services/OpenClawService')} [openClawService]
   * @param {import('../models/ConfigRepository')} [configRepo]
   * @param {import('../models/OpenClawRepository')} [openClawRepo]
   * @param {import('../services/QuizEngine')} [quizEngine]
   */
  constructor(aiService, schedulerService = null, openClawService = null, configRepo = null, openClawRepo = null, quizEngine = null) {
    super(aiService, 'discord');

    this.#schedulerService = schedulerService;
    this.#openClawService = openClawService;
    this.#configRepo = configRepo;
    this.#openClawRepo = openClawRepo;
    this.#quizEngine = quizEngine;
    this.#approvalCommandService = openClawService
      ? new ApprovalCommandService({
        openClawService,
        allowedUserIds: String(process.env.CEO_DISCORD_USER_IDS || process.env.CEO_DISCORD_USER_ID || '')
          .split(',').map((id) => id.trim()).filter(Boolean),
        guildId: process.env.DISCORD_GUILD_ID || '',
        channelId: process.env.CEO_DISCORD_CHANNEL_ID || '',
      })
      : null;
    this.#ceoCommandService = openClawService
      ? new CeoCommandService({
        openClawService,
        allowedUserIds: String(process.env.CEO_DISCORD_USER_IDS || process.env.CEO_DISCORD_USER_ID || '')
          .split(',').map((id) => id.trim()).filter(Boolean),
        guildId: process.env.DISCORD_GUILD_ID || '',
        channelId: process.env.CEO_DISCORD_CHANNEL_ID || '',
      })
      : null;

    this.#client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        MessageManager: 100,   // limit to 100 messages per channel
        GuildMemberManager: 200,   // limit to 200 members
      }),
    });

    this.#registerHandlers();
  }

  /** Expose the raw Discord.js Client (e.g. for SchedulerService). */
  getClient() {
    return this.#client;
  }

  #registerHandlers() {
    this.#client.on('clientReady', () => {
      console.log(`[Discord] Bot online: ${this.#client.user.tag} (${this.#client.user.id})`);
    });
    this.#client.on('interactionCreate', (i) => this.#handleInteraction(i));
    this.#client.on('messageCreate', (msg) => this.#handleMessage(msg));
    this.#client.on('error', (err) => console.error('[Discord] Client error:', err));
    this.#client.on('warn', (msg) => console.warn('[Discord] Warning:', msg));
  }

  /** Handle slash commands and button interactions */
  async #handleInteraction(interaction) {
    if (interaction.isButton()) {
      return this.#handleQuizButton(interaction);
    }
    if (!interaction.isChatInputCommand()) return;
    console.log(`[Discord] Slash /${interaction.commandName} | user=${interaction.user.username}(${interaction.user.id}) guild=${interaction.guildId}`);

    switch (interaction.commandName) {
      case 'ai': return this.#handleAiCommand(interaction);
      case 'myschedule': return this.#handleMySchedule(interaction);
      case 'delschedule': return this.#handleDelSchedule(interaction);
      case 'setchannelschedule': return this.#handleSetChannelSchedule(interaction);
      case 'approval': return this.#handleApproval(interaction);
      case 'ceo': return this.#handleCeoCommand(interaction);
      case 'quiz': return this.#handleQuizCommand(interaction);
      case 'leaderboard': return this.#handleLeaderboardCommand(interaction);
    }
  }

  async #handleQuizCommand(interaction) {
    await interaction.deferReply();
    if (!this.#quizEngine) {
      return interaction.editReply('❌ Quiz Engine chưa được khởi tạo.');
    }
    try {
      const mode = interaction.options?.getString('mode') || 'multiple_choice';
      const res = await this.#quizEngine.generateQuestions({ mode, limit: 1 });
      if (!res.questions?.length) {
        return interaction.editReply('Chưa có đủ từ vựng để tạo bài Quiz.');
      }
      const q = res.questions[0];

      const row = new ActionRowBuilder();
      q.options.forEach((opt, idx) => {
        const payloadStr = Buffer.from(opt).toString('base64').slice(0, 30);
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`quiz:${q.id}:${idx}:${payloadStr}`)
            .setLabel(`${String.fromCharCode(65 + idx)}. ${opt.slice(0, 75)}`)
            .setStyle(ButtonStyle.Primary)
        );
      });

      await interaction.editReply({
        content: `🎮 **QUIZ TỪ VỰNG TƯƠNG TÁC**\n\n${q.prompt}\n\n*Bấm nút bên dưới để chọn đáp án:*`,
        components: [row],
      });
    } catch (err) {
      await interaction.editReply(`❌ Lỗi tạo Quiz: ${err.message}`);
    }
  }

  async #handleQuizButton(interaction) {
    const parts = interaction.customId.split(':');
    if (parts[0] !== 'quiz') return;

    await interaction.deferUpdate();
    const wordId = Number(parts[1]);
    const userChoiceBase64 = parts[3];
    const userChoice = Buffer.from(userChoiceBase64, 'base64').toString('utf8');

    try {
      const result = await this.#quizEngine.submitAnswer({
        userId: interaction.user.id,
        username: interaction.user.username,
        wordId,
        quizType: 'multiple_choice',
        answer: userChoice,
      });

      const icon = result.isCorrect ? '🎉' : '❌';
      const statusText = result.isCorrect ? '**CHÍNH XÁC!** (+10 điểm)' : `**CHƯA ĐÚNG!** (Đáp án đúng: ${result.expected})`;

      await interaction.editReply({
        content: `${icon} ${statusText}\n👤 **${interaction.user.username}** · Tổng điểm: **${result.userStats.total_score}** (🔥 ${result.userStats.streak_days} ngày)\n\n📖 Từ: **${result.explanation.word}** ${result.explanation.pronunciation || ''}\n💡 Nghĩa: ${result.explanation.meaning}`,
        components: [],
      });
    } catch (err) {
      await interaction.followUp({ content: `❌ Lỗi: ${err.message}`, ephemeral: true });
    }
  }

  async #handleLeaderboardCommand(interaction) {
    await interaction.deferReply();
    if (!this.#quizEngine) {
      return interaction.editReply('❌ Quiz Engine chưa được khởi tạo.');
    }
    try {
      const rankings = await this.#quizEngine.getLeaderboard(10);
      if (!rankings.length) {
        return interaction.editReply('🏆 Chưa có học viên trong bảng xếp hạng.');
      }
      const lines = rankings.map((r, i) => {
        const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `#${i + 1}`));
        return `${medal} **${r.username}** — **${r.total_score} điểm** (🔥 ${r.streak_days} ngày)`;
      });
      await interaction.editReply(`🏆 **BẢNG XẾP HẠNG HỌC VIÊN VOCABULARY**\n──────────────\n${lines.join('\n')}`);
    } catch (err) {
      await interaction.editReply(`❌ Lỗi: ${err.message}`);
    }
  }

  async #handleCeoCommand(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!this.#ceoCommandService) {
      return interaction.editReply('❌ OpenClaw chưa được cấu hình.');
    }
    try {
      const reply = await this.#ceoCommandService.execute({
        commandName: interaction.options.getString('command'),
        payloadJson: interaction.options.getString('payload'),
        interactionId: interaction.id,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
      });
      return interaction.editReply(reply);
    } catch (error) {
      console.error('[Discord] /ceo error:', error.message);
      return interaction.editReply(`❌ ${error.message}`);
    }
  }

  async #handleApproval(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!this.#approvalCommandService) {
      return interaction.editReply('❌ OpenClaw chưa được cấu hình.');
    }

    try {
      const reply = await this.#approvalCommandService.decide({
        approvalId: interaction.options.getString('approval_id'),
        decision: interaction.options.getString('decision'),
        decisionVersion: interaction.options.getInteger('version'),
        reason: interaction.options.getString('reason'),
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
      });
      return interaction.editReply(reply);
    } catch (error) {
      console.error('[Discord] /approval error:', error.message);
      return interaction.editReply(`❌ ${error.message}`);
    }
  }

  /** Handle /ai slash command */
  async #handleAiCommand(interaction) {
    await interaction.deferReply();
    const prompt = interaction.options.getString('prompt');
    console.log(`[Discord] /ai | user=${interaction.user.username} channel=${interaction.channelId} prompt="${prompt.slice(0, 80)}"`);
    try {
      const t0 = Date.now();
      const openClawEnabled = this.#configRepo?.get('openclaw_enabled') === 'true';
      const text = openClawEnabled && this.#openClawService
        ? await this._aiService.agentChat({
          channelId: interaction.channelId,
          userId: interaction.user.id,
          username: interaction.user.username,
          prompt,
          platform: this._platform,
          openClawService: this.#openClawService,
        })
        : await this._aiService.chat({
          channelId: interaction.channelId,
          userId: interaction.user.id,
          username: interaction.user.username,
          prompt,
          platform: this._platform,
        });
      console.log(`[Discord] /ai done | ${Date.now() - t0}ms`);
      await interaction.editReply(this.#truncate(text));
    } catch (err) {
      console.error('[Discord] /ai error:', err);
      await interaction.editReply(`❌ Error: ${err.message}`);
    }
  }

  /** Handle /myschedule slash command */
  async #handleMySchedule(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!this.#schedulerService) {
      return interaction.editReply('❌ Scheduler chưa được bật.');
    }
    try {
      const schedules = await this.#schedulerService.listByUser(
        interaction.user.id, this._platform
      );
      if (!schedules.length) {
        return interaction.editReply('📅 Bạn chưa có lịch nào.');
      }
      const lines = schedules.map((s) => {
        const repeat = s.repeat_type !== 'none' ? ` 🔁 ${s.repeat_type}` : '';
        return `\`#${s.id}\` **${TimeUtils.display(s.remind_at)}** ${s.title}${repeat}`;
      });
      const reply = `📅 **Lịch sắp tới** (${schedules.length}):\n${lines.join('\n')}`;
      await interaction.editReply(this.#truncate(reply));
    } catch (err) {
      console.error('[Discord] /myschedule error:', err);
      await interaction.editReply(`❌ Lỗi: ${err.message}`);
    }
  }

  /** Handle /delschedule slash command */
  async #handleDelSchedule(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!this.#schedulerService) {
      return interaction.editReply('❌ Scheduler chưa được bật.');
    }
    const id = interaction.options.getInteger('id');
    try {
      const ok = await this.#schedulerService.deleteSchedule(id, interaction.user.id);
      if (ok) {
        await interaction.editReply(`✅ Đã xóa lịch **#${id}**.`);
      } else {
        await interaction.editReply(`❌ Không tìm thấy lịch #${id} của bạn.`);
      }
    } catch (err) {
      console.error('[Discord] /delschedule error:', err);
      await interaction.editReply(`❌ Lỗi: ${err.message}`);
    }
  }

  /** Handle /setchannelschedule slash command (admin only) */
  async #handleSetChannelSchedule(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!this.#schedulerService) {
      return interaction.editReply('❌ Scheduler chưa được bật.');
    }

    // Only guild admins can set the notification channel
    if (!interaction.memberPermissions?.has('Administrator')) {
      return interaction.editReply('❌ Chỉ admin mới được dùng lệnh này.');
    }

    const channel = interaction.options.getChannel('channel');
    try {
      await this.#schedulerService.setNotificationChannel(channel.id);
      await interaction.editReply(`✅ Đã đặt channel thông báo lịch: <#${channel.id}>`);
    } catch (err) {
      console.error('[Discord] /setchannelschedule error:', err);
      await interaction.editReply(`❌ Lỗi: ${err.message}`);
    }
  }

  /** Handle plain messages that mention "đần" */
  async #handleMessage(msg) {
    if (msg.author.bot) return;
    if (!/đần/i.test(msg.content)) return;

    console.log(`[Discord] Message | user=${msg.author.username}(${msg.author.id}) channel=${msg.channelId} text="${msg.content.slice(0, 100)}"`);

    const openClawEnabled = this.#configRepo?.get('openclaw_enabled') === 'true';
    const result = await this._handleDanCommand(msg.content, (s) => msg.reply(s));
    if (result.handled) return;

    // When OpenClaw is enabled, route all regular queries through agent loop
    if (openClawEnabled && this.#openClawService) {
      return this.#replyAgentChat(msg, result.prompt);
    }

    msg.channel.sendTyping();
    try {
      const t0 = Date.now();
      const text = await this._aiService.chat({
        channelId: msg.channelId,
        userId: msg.author.id,
        username: msg.author.username,
        prompt: result.prompt,
        platform: this._platform,
      });
      console.log(`[Discord] AI reply done | ${Date.now() - t0}ms`);
      await msg.reply(this.#truncate(text));
    } catch (err) {
      console.error('[Discord] Message error:', err);
      await msg.reply(`❌ Error: ${err.message}`);
    }
  }


  /**
   * Search or crawl via OpenClaw, summarise with AI, reply to user.
   * Handle a user message via the AI agent loop.
   * AI autonomously decides which OpenClaw tools to call (search, crawl, fetch, automate).
   * Shows a typing indicator throughout the multi-step process.
   * @param {import('discord.js').Message} msg
   * @param {string} prompt
   */
  async #replyAgentChat(msg, prompt) {
    await this._replyWithThinking({
      createThinking: () => {
        msg.channel.sendTyping().catch(() => { });
        const typingInterval = setInterval(() => msg.channel.sendTyping().catch(() => { }), 8000);
        return typingInterval;
      },
      deleteThinking: (typingInterval) => {
        clearInterval(typingInterval);
        return Promise.resolve();
      },
      run: async () => {
        const t0 = Date.now();
        const text = await this._aiService.agentChat({
          channelId: msg.channelId,
          userId: msg.author.id,
          username: msg.author.username,
          prompt,
          platform: this._platform,
          openClawService: this.#openClawService,
          schedulerService: this.#schedulerService,
        });
        console.log(`[Discord] agentChat done | ${Date.now() - t0}ms`);
        return text;
      },
      reply: (text) => msg.reply(this.#truncate(text)),
      errorReply: () => '❌ Tao gặp lỗi khi tìm kiếm, thử lại sau nha 😅',
    });
  }

  /**
   * Async agent chat — ACK immediately, send result to channel when done.
   * Used for large research requests that take 30s-1min.
   *
   * @param {string}   channelId
   * @param {string}   userId
   * @param {string}   username
   * @param {string}   prompt
   * @param {Function} ackFn  async (text) => void — sends the immediate acknowledgement
   */
  async #replyAgentChatAsync(channelId, userId, username, prompt, ackFn) {
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
          const channel = await this.#client.channels.fetch(channelId);
          if (err) {
            await channel.send(`<@${userId}> ❌ Tác vụ \`#${taskId}\` thất bại: ${err.message}`);
            return;
          }
          const body = result || '';
          const head = `<@${userId}> ✅ **Xong!** Task \`#${taskId}\`\n\n`;
          const MAX = 1900;
          await channel.send(head + body.slice(0, MAX - head.length));
          let i = MAX - head.length;
          while (i < body.length) { await channel.send(body.slice(i, i + MAX)); i += MAX; }
        } catch (e) { console.error('[DiscordBot] notify failed:', e.message); }
      },
    });

    await ackFn(`🔍 **Đang xử lý...** Task \`#${taskId}\` — mày sẽ được thông báo khi xong.`);
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
