'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Scheduler service: ticks every minute to fire due reminders,
 * and uses Gemini to parse natural-language schedule text.
 */
class SchedulerService {
  /** @type {import('../models/ScheduleRepository')} */
  #scheduleRepo;
  /** @type {import('../models/ConfigRepository')} */
  #configRepo;
  /** @type {import('discord.js').Client|null} */
  #discordClient = null;

  /**
   * @param {import('../models/ScheduleRepository')} scheduleRepo
   * @param {import('../models/ConfigRepository')} configRepo
   */
  constructor(scheduleRepo, configRepo) {
    this.#scheduleRepo = scheduleRepo;
    this.#configRepo   = configRepo;
  }

  /** Inject after DiscordBot has started. */
  setDiscordClient(client) {
    this.#discordClient = client;
  }

  /** Start the 60-second tick loop. */
  start() {
    setInterval(() => this.#tick(), 60_000);
    console.log('[SchedulerService] Started (60s interval)');
  }

  async #tick() {
    try {
      const rows = await this.#scheduleRepo.findUpcoming();
      if (rows.length) {
        console.log(`[Scheduler] Tick | ${rows.length} schedule(s) due`);
      }
      for (const row of rows) {
        await this.#fireReminder(row);
      }
    } catch (err) {
      console.error('[Scheduler] Tick error:', err);
    }
  }

  /**
   * Send reminder notification and update schedule.
   * @param {object} row  - schedule DB row
   */
  async #fireReminder(row) {
    console.log(`[Scheduler] Fire #${row.id} | user=${row.username}(${row.user_id}) title="${row.title}" repeat=${row.repeat_type}`);
    try {
      await this.#sendDiscordNotification(row);
    } catch (err) {
      console.error(`[Scheduler] Notify failed #${row.id}:`, err.message);
    }

    let nextRemindAt = null;
    if (row.repeat_type === 'daily') {
      nextRemindAt = this.#addDays(row.remind_at, 1);
    } else if (row.repeat_type === 'weekly') {
      nextRemindAt = this.#addDays(row.remind_at, 7);
    }
    await this.#scheduleRepo.markFired(row.id, nextRemindAt);
    console.log(`[Scheduler] Marked #${row.id} | next=${nextRemindAt ?? 'deactivated'}`);
  }

  /**
   * Send notification to Discord channel.
   * @param {object} row
   */
  async #sendDiscordNotification(row) {
    if (!this.#discordClient) return;

    const channelId = row.channel_id
      || this.#configRepo.get('schedule_discord_channel_id');

    if (!channelId) {
      console.warn(`[SchedulerService] No channel_id for schedule #${row.id}`);
      return;
    }

    const channel = await this.#discordClient.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      console.warn(`[Scheduler] Channel ${channelId} not found for schedule #${row.id}`);
      return;
    }

    const repeatLabel = this.#repeatLabel(row.repeat_type, row.remind_at);
    const message = [
      '⏰ **Nhắc lịch!**',
      `👤 <@${row.user_id}>`,
      `📌 ${row.title}`,
      `🔁 ${repeatLabel}`,
    ].join('\n');

    await channel.send(message);
    console.log(`[Scheduler] Sent notification #${row.id} → channel=${channelId}`);
  }

  /**
   * Get active schedules for a user.
   * @param {string} userId
   * @param {string} platform
   */
  async listByUser(userId, platform) {
    return this.#scheduleRepo.findByUser(userId, platform);
  }

  /**
   * Delete a schedule owned by the given user.
   * @param {number} id
   * @param {string} userId
   */
  async deleteSchedule(id, userId) {
    return this.#scheduleRepo.delete(id, userId);
  }

  /**
   * Persist the notification channel ID in config.
   * @param {string} channelId
   */
  async setNotificationChannel(channelId) {
    await this.#configRepo.set('schedule_discord_channel_id', channelId);
  }

  /**
   * Parse natural-language schedule text via Gemini and persist it.
   * @param {string} text
   * @param {string} userId
   * @param {string} username
   * @param {string} channelId
   * @param {string} platform
   * @returns {Promise<{id: number, title: string, remindAt: string, repeatType: string}>}
   */
  async parseAndCreate(text, userId, username, channelId, platform) {
    const parsed = await this.#parseWithGemini(text);

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    // Normalize field names — Gemini sometimes returns camelCase variants
    const title      = parsed.title      || parsed.Title      || null;
    const remindAt   = parsed.remind_at  || parsed.remindAt   || parsed.remind_time || null;
    const repeatType = parsed.repeat_type || parsed.repeatType || 'none';

    if (!title) {
      console.warn('[Scheduler] Missing title, parsed:', JSON.stringify(parsed));
      throw new Error('Không parse được tiêu đề lịch — thử diễn đạt lại nhé!');
    }
    if (!remindAt) {
      console.warn('[Scheduler] Missing remindAt, parsed:', JSON.stringify(parsed));
      throw new Error('Không parse được thời gian — ghi rõ ngày/giờ nhé! (vd: "thứ 2 8h")');
    }

    const id = await this.#scheduleRepo.create({
      userId,
      username:   username   || null,
      platform:   platform   || 'discord',
      channelId:  channelId  || null,
      title,
      remindAt,
      repeatType,
    });

    console.log(`[Scheduler] Created #${id} | user=${username}(${userId}) title="${title}" at=${remindAt} repeat=${repeatType}`);
    return { id, title, remindAt, repeatType };
  }

  /**
   * Call Gemini to parse a schedule from natural-language Vietnamese text.
   * @param {string} text
   * @returns {Promise<{title: string, remind_at: string, repeat_type: string}|{error: string}>}
   */
  async #parseWithGemini(text) {
    const apiKey = process.env.GEMINI_KEY;
    if (!apiKey) throw new Error('GEMINI_KEY not configured');

    const modelName = this.#configRepo.get('gemini_model') || 'models/gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace('T', ' ');

    const prompt = `Hôm nay là ${dateStr}. Parse lịch từ text sau (tiếng Việt).
Text: "${text}"
Trả về JSON: { "title": "...", "remind_at": "YYYY-MM-DD HH:MM:SS", "repeat_type": "none|daily|weekly" }
Chỉ trả JSON, không giải thích. Nếu không parse được, trả { "error": "..." }`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    console.log('[Scheduler] Gemini parse response:', raw);

    // Strip markdown code fences if present, then extract first {...} block
    let jsonStr = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      return JSON.parse(jsonStr);
    } catch {
      return { error: `Không parse được JSON từ Gemini: ${raw}` };
    }
  }

  /**
   * Add days to a datetime string or Date and return "YYYY-MM-DD HH:MM:SS".
   * @param {string|Date} base
   * @param {number} days
   */
  #addDays(base, days) {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Human-readable repeat label.
   * @param {string} repeatType
   * @param {string|Date} remindAt
   */
  #repeatLabel(repeatType, remindAt) {
    const d = new Date(remindAt);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayName = days[d.getDay()];
    const hhmm = d.toTimeString().slice(0, 5);

    if (repeatType === 'weekly')  return `Hàng tuần (${dayName} ${hhmm})`;
    if (repeatType === 'daily')   return `Hàng ngày (${hhmm})`;
    return `Một lần (${dayName} ${hhmm})`;
  }
}

module.exports = SchedulerService;
