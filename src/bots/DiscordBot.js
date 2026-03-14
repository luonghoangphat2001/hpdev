'use strict';

const { Client, GatewayIntentBits } = require('discord.js');
const BaseBot   = require('./BaseBot');
const TimeUtils = require('../utils/TimeUtils');

/**
 * Discord bot.
 * Handles slash commands and natural-language "đần" triggers.
 */
class DiscordBot extends BaseBot {
  /** @type {Client} */
  #client;

  /** @type {import('../services/SchedulerService')|null} */
  #schedulerService = null;

  static #SCHEDULE_FORMAT_GUIDE = [
    '📅 **Hướng dẫn thêm lịch**',
    '',
    '**① Một lịch (AI parse):**',
    '```',
    'đần thêm lịch thứ 2 8h học Toán',
    'đần thêm lịch ngày mai 9h họp nhóm',
    'đần nhắc tôi ngày 20/03 lúc 7h thi giữa kỳ',
    '```',
    '',
    '**② Nhiều lịch cùng lúc (theo thời khoá biểu):**',
    '```',
    'đần thêm lịch',
    'Ngày 15/03/2026 học Lập trình hướng đối tượng giờ 05:45 - 08:45',
    'Ngày 16/03/2026 học Kinh tế chính trị Mác - Lênin giờ 11:00 - 14:00',
    'Ngày 17/03/2026 học Đại số tuyến tính giờ 11:00 - 14:00',
    '```',
    '',
    '**③ Xem lịch:**',
    '```',
    'đần xem lịch              ← tất cả lịch sắp tới',
    'đần xem lịch hôm nay',
    'đần xem lịch ngày 15/03/2026',
    '```',
    '',
    '**④ Chỉnh sửa lịch:**',
    '```',
    'đần chỉnh sửa lịch Toán 1 ngày 14/03/2026 8h30pm',
    'đần sửa lịch #5 ngày mai 9h',
    'đần cập nhật lịch #3 tiêu đề: Họp nhóm',
    '```',
    '',
    '**⑤ Xóa lịch:**',
    '```',
    'đần xóa lịch 5            ← xóa lịch ID 5',
    '/delschedule id:5',
    '```',
  ].join('\n');

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
    if (msg.author.bot)            return;
    if (!/đần/i.test(msg.content)) return;

    console.log(`[Discord] Message | user=${msg.author.username}(${msg.author.id}) channel=${msg.channelId} text="${msg.content.slice(0, 100)}"`);

    const result = await this._handleDanCommand(msg.content, (s) => msg.reply(s));
    if (result.handled) return;

    // Schedule intent handling
    if (result.isSchedule && this.#schedulerService) {
      const norm = result.prompt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

      if (/xem\s+(lich|reminder)/.test(norm)) {
        return this.#replyScheduleView(msg, norm, result.prompt);
      }

      if (/xoa\s+(lich|reminder)/.test(norm)) {
        return this.#replyScheduleDelete(msg, result.prompt);
      }

      if (/(chinh\s*sua|sua|cap\s*nhat)\s*(lich|reminder|nhac)/.test(norm)) {
        return this.#replyScheduleEdit(msg, result.prompt);
      }

      // "thêm lịch" without actual schedule content → show format guide
      if (/^(them|dat)\s+(lich|reminder|nhac)\s*$/.test(norm.trim())) {
        return msg.reply(DiscordBot.#SCHEDULE_FORMAT_GUIDE);
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

  /**
   * Route "xem lịch" to date-specific or full list.
   * @param {import('discord.js').Message} msg
   * @param {string} norm  normalised (no diacritics) prompt
   * @param {string} raw   original prompt text
   */
  async #replyScheduleView(msg, norm, raw) {
    const tz = this.#schedulerService
      ? (this.#schedulerService.getTimezone?.() || 'Asia/Ho_Chi_Minh')
      : 'Asia/Ho_Chi_Minh';

    // "hôm nay" → today
    if (/hom\s*nay/.test(norm)) {
      return this.#replyScheduleByDate(msg, TimeUtils.todayString(tz));
    }

    // "ngày DD/MM" or "ngày DD/MM/YYYY"
    const dateMatch = raw.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/);
    if (dateMatch) {
      const dd   = dateMatch[1].padStart(2, '0');
      const mm   = dateMatch[2].padStart(2, '0');
      const yyyy = dateMatch[3] || TimeUtils.todayString(tz).slice(0, 4);
      const dateStr = `${yyyy}-${mm}-${dd}`;
      return this.#replyScheduleByDate(msg, dateStr);
    }

    // No date → show all upcoming
    return this.#replyScheduleList(msg);
  }

  async #replyScheduleEdit(msg, prompt) {
    msg.channel.sendTyping();
    try {
      const result = await this.#schedulerService.parseAndUpdate(
        prompt, msg.author.id, this._platform
      );

      if (result.status === 'not_found') {
        return msg.reply('❓ Tao không tìm thấy lịch đó — thử `đần xem lịch` để xem danh sách rồi chỉnh bằng ID nhé!');
      }

      if (result.status === 'bulk_updated') {
        const lines = result.schedules.map(
          (s) => `\`#${s.id}\` **${TimeUtils.display(s.remind_at)}** ${s.title}`
        );
        const header = `✅ Đã cập nhật **${result.count} lịch** "${result.keyword}":\n`;
        const chunks = [];
        let cur = header;
        for (const line of lines) {
          if (cur.length + line.length + 1 > 1990) { chunks.push(cur); cur = ''; }
          cur += line + '\n';
        }
        if (cur) chunks.push(cur);
        for (const chunk of chunks) await msg.reply(chunk);
        return;
      }

      if (result.status === 'ambiguous') {
        const lines = result.matches.map(
          (s) => `\`#${s.id}\` **${TimeUtils.display(s.remind_at)}** ${s.title}`
        );
        return msg.reply(
          `🔍 Tao tìm được ${result.matches.length} lịch khớp, mày muốn sửa cái nào?\n` +
          lines.join('\n') +
          '\n\n➡️ Gõ lại kèm ID, vd: _đần chỉnh sửa lịch #3 8h30pm_'
        );
      }

      // status === 'updated'
      const s       = result.schedule;
      const display = TimeUtils.display(s.remind_at);
      await msg.reply(`✅ Đã cập nhật lịch **#${s.id}**:\n📌 ${s.title}\n📅 ${display}`);

    } catch (err) {
      console.error('[Discord] Schedule edit error:', err);
      await msg.reply(this.#truncate(`❌ Không sửa được lịch: ${err.message}`));
    }
  }

  async #replyScheduleByDate(msg, dateStr) {
    try {
      const schedules = await this.#schedulerService.listByDate(msg.author.id, this._platform, dateStr);
      const [yyyy, mm, dd] = dateStr.split('-');
      const label = `${dd}/${mm}/${yyyy}`;

      if (!schedules.length) {
        return msg.reply(`📅 Ngày **${label}** mày không có lịch nào cả — thoải mái 😎`);
      }

      const lines = schedules.map((s) => {
        const repeat = s.repeat_type !== 'none' ? ` 🔁` : '';
        return `\`#${s.id}\` **${TimeUtils.timeOf(s.remind_at)}** ${s.title}${repeat}`;
      });

      const reply = `📅 **Lịch ngày ${label}** (${schedules.length} buổi):\n${lines.join('\n')}`;
      await msg.reply(this.#truncate(reply));
    } catch (err) {
      console.error('[Discord] Schedule by-date error:', err);
      await msg.reply(`❌ Lỗi: ${err.message}`);
    }
  }

  async #replyScheduleList(msg) {
    try {
      const schedules = await this.#schedulerService.listByUser(msg.author.id, this._platform);
      if (!schedules.length) {
        return msg.reply(`📅 Mày chưa có lịch nào đâu!\n\n${DiscordBot.#SCHEDULE_FORMAT_GUIDE}`);
      }

      const lines = schedules.map((s) => {
        const repeat = s.repeat_type !== 'none' ? ` 🔁 ${s.repeat_type}` : '';
        return `\`#${s.id}\` **${TimeUtils.display(s.remind_at)}** ${s.title}${repeat}`;
      });

      // Split into chunks if needed
      const header = `📅 **Lịch sắp tới của mày** (${schedules.length}):\n`;
      const chunks = [];
      let cur = header;
      for (const line of lines) {
        if (cur.length + line.length + 1 > 1990) { chunks.push(cur); cur = ''; }
        cur += line + '\n';
      }
      if (cur) chunks.push(cur);
      for (const chunk of chunks) await msg.reply(chunk);

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

      const dStr = TimeUtils.display(schedule.remindAt);
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
