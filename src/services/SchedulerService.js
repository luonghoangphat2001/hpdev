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
      for (const row of rows) {
        await this.#fireReminder(row);
      }
    } catch (err) {
      console.error('[SchedulerService] Tick error:', err);
    }
  }

  /**
   * Send reminder notification and update schedule.
   * @param {object} row  - schedule DB row
   */
  async #fireReminder(row) {
    try {
      await this.#sendDiscordNotification(row);
    } catch (err) {
      console.error(`[SchedulerService] Failed to notify schedule #${row.id}:`, err);
    }

    let nextRemindAt = null;
    if (row.repeat_type === 'daily') {
      nextRemindAt = this.#addDays(row.remind_at, 1);
    } else if (row.repeat_type === 'weekly') {
      nextRemindAt = this.#addDays(row.remind_at, 7);
    }
    await this.#scheduleRepo.markFired(row.id, nextRemindAt);
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
      console.warn(`[SchedulerService] Channel ${channelId} not found`);
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

    const id = await this.#scheduleRepo.create({
      userId,
      username,
      platform,
      channelId,
      title:      parsed.title,
      remindAt:   parsed.remind_at,
      repeatType: parsed.repeat_type || 'none',
    });

    return { id, title: parsed.title, remindAt: parsed.remind_at, repeatType: parsed.repeat_type || 'none' };
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

    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();

    try {
      return JSON.parse(jsonStr);
    } catch {
      return { error: `Không parse được JSON: ${raw}` };
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
