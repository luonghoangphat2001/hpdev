'use strict';

const { Client, GatewayIntentBits } = require('discord.js');
const BaseBot = require('./BaseBot');

/**
 * Discord bot.
 * Handles slash commands and natural-language "đần" triggers.
 */
class DiscordBot extends BaseBot {
  /** @type {Client} */
  #client;

  /** @type {import('../services/SchedulerService')|null} */
  #schedulerService = null;

  /**
   * @param {import('../services/AIService')} aiService
   * @param {import('../services/SchedulerService')} [schedulerService]
   */
  constructor(aiService, schedulerService = null) {
    super(aiService, 'discord');

    this.#schedulerService = schedulerService;

    this.#client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
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
    this.#client.on('interactionCreate', (i)   => this.#handleInteraction(i));
    this.#client.on('messageCreate',     (msg) => this.#handleMessage(msg));
    this.#client.on('error', (err) => console.error('[Discord] Client error:', err));
    this.#client.on('warn',  (msg) => console.warn('[Discord] Warning:', msg));
  }

  /** Handle slash commands */
  async #handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;
    console.log(`[Discord] Slash /${interaction.commandName} | user=${interaction.user.username}(${interaction.user.id}) guild=${interaction.guildId}`);

    switch (interaction.commandName) {
      case 'ai':             return this.#handleAiCommand(interaction);
      case 'myschedule':     return this.#handleMySchedule(interaction);
      case 'delschedule':    return this.#handleDelSchedule(interaction);
      case 'setchannelschedule': return this.#handleSetChannelSchedule(interaction);
    }
  }

  /** Handle /ai slash command */
  async #handleAiCommand(interaction) {
    await interaction.deferReply();
    const prompt = interaction.options.getString('prompt');
    console.log(`[Discord] /ai | user=${interaction.user.username} channel=${interaction.channelId} prompt="${prompt.slice(0, 80)}"`);
    try {
      const t0   = Date.now();
      const text = await this._aiService.chat({
        channelId: interaction.channelId,
        userId:    interaction.user.id,
        username:  interaction.user.username,
        prompt,
        platform:  this._platform,
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
        const d = new Date(s.remind_at);
        const dStr = d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const repeat = s.repeat_type !== 'none' ? ` (${s.repeat_type})` : '';
        return `**#${s.id}** ${s.title} — ${dStr}${repeat}`;
      });
      await interaction.editReply(`📅 **Lịch của bạn:**\n${lines.join('\n')}`);
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
    if (msg.author.bot)            return;
    if (!/đần/i.test(msg.content)) return;

    console.log(`[Discord] Message | user=${msg.author.username}(${msg.author.id}) channel=${msg.channelId} text="${msg.content.slice(0, 100)}"`);

    const result = await this._handleDanCommand(msg.content, (s) => msg.reply(s));
    if (result.handled) return;

    // Schedule intent handling
    if (result.isSchedule && this.#schedulerService) {
      const norm = result.prompt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

      if (/xem\s+(lich|reminder)/.test(norm)) {
        return this.#replyScheduleList(msg);
      }

      if (/xoa\s+(lich|reminder)/.test(norm)) {
        return this.#replyScheduleDelete(msg, result.prompt);
      }

      return this.#replyScheduleCreate(msg, result.prompt);
    }

    msg.channel.sendTyping();
    try {
      const t0   = Date.now();
      const text = await this._aiService.chat({
        channelId: msg.channelId,
        userId:    msg.author.id,
        username:  msg.author.username,
        prompt:    result.prompt,
        platform:  this._platform,
      });
      console.log(`[Discord] AI reply done | ${Date.now() - t0}ms`);
      await msg.reply(this.#truncate(text));
    } catch (err) {
      console.error('[Discord] Message error:', err);
      await msg.reply(`❌ Error: ${err.message}`);
    }
  }

  async #replyScheduleList(msg) {
    try {
      const schedules = await this.#schedulerService.listByUser(msg.author.id, this._platform);
      if (!schedules.length) {
        return msg.reply('📅 Mày chưa có lịch nào đâu!');
      }
      const lines = schedules.map((s) => {
        const d = new Date(s.remind_at);
        const dStr = d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const repeat = s.repeat_type !== 'none' ? ` (${s.repeat_type})` : '';
        return `**#${s.id}** ${s.title} — ${dStr}${repeat}`;
      });
      await msg.reply(`📅 **Lịch của mày:**\n${lines.join('\n')}`);
    } catch (err) {
      console.error('[Discord] Schedule list error:', err);
      await msg.reply(`❌ Lỗi: ${err.message}`);
    }
  }

  async #replyScheduleDelete(msg, prompt) {
    const match = prompt.match(/\d+/);
    if (!match) {
      return msg.reply('❓ Cho tao biết ID lịch muốn xóa (vd: "đần xóa lịch 3")');
    }
    try {
      const ok = await this.#schedulerService.deleteSchedule(Number(match[0]), msg.author.id);
      if (ok) {
        await msg.reply(`✅ Đã xóa lịch **#${match[0]}** rồi nha!`);
      } else {
        await msg.reply(`❌ Không tìm thấy lịch #${match[0]} của mày.`);
      }
    } catch (err) {
      console.error('[Discord] Schedule delete error:', err);
      await msg.reply(`❌ Lỗi: ${err.message}`);
    }
  }

  async #replyScheduleCreate(msg, prompt) {
    msg.channel.sendTyping();

    // Detect bulk input: 3+ occurrences of "Ngày" → bulk mode
    const isBulk = (prompt.match(/ng[aà]y\s+\d/gi) || []).length >= 3;

    if (isBulk) {
      return this.#replyScheduleCreateBulk(msg, prompt);
    }

    try {
      const schedule = await this.#schedulerService.parseAndCreate(
        prompt,
        msg.author.id,
        msg.author.username,
        msg.channelId,
        this._platform
      );

      const d = new Date(schedule.remindAt);
      const dStr = d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const repeatLabel = schedule.repeatType !== 'none'
        ? ` | 🔁 ${schedule.repeatType === 'weekly' ? 'Hàng tuần' : 'Hàng ngày'}`
        : '';

      await msg.reply(
        `✅ Đã đặt lịch **#${schedule.id}**: ${schedule.title}\n📅 ${dStr}${repeatLabel}`
      );
    } catch (err) {
      console.error('[Discord] Schedule create error:', err);
      await msg.reply(this.#truncate(`❌ Không tạo được lịch: ${err.message}`));
    }
  }

  async #replyScheduleCreateBulk(msg, prompt) {
    try {
      const result = await this.#schedulerService.parseAndCreateBulk(
        prompt,
        msg.author.id,
        msg.author.username,
        msg.channelId,
        this._platform
      );

      const header = `📅 **Đã thêm ${result.created} lịch** (bỏ qua: ${result.skipped})\n`;

      // Split into ≤2000-char chunks so Discord doesn't reject
      const chunks = [];
      let current  = header;
      for (const line of result.lines) {
        if (current.length + line.length + 1 > 1990) {
          chunks.push(current);
          current = '';
        }
        current += line + '\n';
      }
      if (current) chunks.push(current);

      for (const chunk of chunks) {
        await msg.reply(chunk);
      }
    } catch (err) {
      console.error('[Discord] Bulk schedule create error:', err);
      await msg.reply(this.#truncate(`❌ Không tạo được lịch: ${err.message}`));
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
