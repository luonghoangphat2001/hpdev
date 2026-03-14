'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const TimeUtils = require('../utils/TimeUtils');

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

  /** Current configured timezone (IANA). */
  getTimezone() {
    return this.#configRepo.get('schedule_timezone') || 'Asia/Ho_Chi_Minh';
  }

  /** Start the 60-second tick loop. */
  start() {
    setInterval(() => this.#tick(), 60_000);
    console.log('[SchedulerService] Started (60s interval)');
  }

  async #tick() {
    try {
      const tz     = this.#configRepo.get('schedule_timezone') || 'Asia/Ho_Chi_Minh';
      const nowStr = TimeUtils.nowString(tz);
      const rows   = await this.#scheduleRepo.findUpcoming(nowStr);
      if (rows.length) {
        console.log(`[Scheduler] Tick | ${rows.length} schedule(s) due | now=${nowStr} (${tz})`);
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
      nextRemindAt = TimeUtils.addDays(row.remind_at, 1);
    } else if (row.repeat_type === 'weekly') {
      nextRemindAt = TimeUtils.addDays(row.remind_at, 7);
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
   * Get active schedules for a user on a specific date.
   * @param {string} userId
   * @param {string} platform
   * @param {string} dateStr  YYYY-MM-DD
   */
  async listByDate(userId, platform, dateStr) {
    return this.#scheduleRepo.findByDate(userId, platform, dateStr);
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
   * Parse an edit request with Gemini, find the target schedule, and update it.
   *
   * Flow:
   *   1. Gemini extracts { id?, search_keyword?, title?, remind_at?, repeat_type? }
   *   2. Locate schedule by id OR by keyword search in user's schedules
   *   3. If multiple matches → return them so caller can ask user to pick
   *   4. Update and return the updated schedule row
   *
   * @param {string} text
   * @param {string} userId
   * @param {string} platform
   * @returns {Promise<
   *   { status: 'updated', schedule: object } |
   *   { status: 'ambiguous', matches: object[] } |
   *   { status: 'not_found' }
   * >}
   */
  async parseAndUpdate(text, userId, platform) {
    const tz = this.getTimezone();

    // ── Fast path: regex for simple "#ID <time>" or "#ID <date> <time>" ──
    const fastParsed = SchedulerService.#fastParseEdit(text, tz);
    if (fastParsed) {
      console.log('[Scheduler] parseAndUpdate fast-path:', JSON.stringify(fastParsed));
      return this.#applyUpdate(fastParsed, userId, platform);
    }

    // ── Slow path: Gemini AI parse ─────────────────────────────────────
    const apiKey = process.env.GEMINI_KEY;
    if (!apiKey) throw new Error('GEMINI_KEY not configured');

    const modelName = this.#configRepo.get('gemini_model') || 'models/gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const nowStr = TimeUtils.promptNow(tz);
    const prompt = `Hôm nay là ${nowStr}. Parse yêu cầu chỉnh sửa lịch từ text sau (tiếng Việt).
Text: "${text}"
Trả về JSON object (chỉ JSON, không giải thích):
{"id":<số ID hoặc null>,"search_keyword":"<từ khoá tìm lịch hoặc null>","title":"<tiêu đề mới hoặc null>","remind_at":"<YYYY-MM-DD HH:MM:SS mới hoặc null>","repeat_type":"<none|daily|weekly hoặc null>"}`;

    const result = await model.generateContent(prompt);
    const raw    = result.response.text().trim();
    console.log('[Scheduler] parseAndUpdate Gemini response:', raw);

    let parsed;
    try {
      const jsonStr   = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : jsonStr);
    } catch {
      throw new Error('Gemini không trả về JSON hợp lệ — thử dùng "#ID giờ" (vd: #5 20:30)');
    }

    // Normalize Gemini fields
    const normalized = {
      id:            parsed.id            || null,
      search_keyword: parsed.search_keyword || null,
      title:         parsed.title         || null,
      remind_at:     parsed.remind_at     || parsed.remindAt  || null,
      repeat_type:   parsed.repeat_type   || parsed.repeatType || null,
    };

    return this.#applyUpdate(normalized, userId, platform);
  }

  /**
   * Shared logic: locate schedule and apply changes.
   * @param {{ id?, search_keyword?, title?, remind_at?, repeat_type? }} p
   */
  async #applyUpdate(p, userId, platform) {
    const changes = {
      title:      p.title      || null,
      remindAt:   p.remind_at  || null,
      repeatType: p.repeat_type || null,
    };

    let target = null;
    if (p.id) {
      target = await this.#scheduleRepo.findById(Number(p.id));
      if (!target || target.user_id !== userId) return { status: 'not_found' };
    } else if (p.search_keyword) {
      const matches = await this.#scheduleRepo.findByKeyword(userId, platform, p.search_keyword);
      if (!matches.length) return { status: 'not_found' };
      if (matches.length > 1) return { status: 'ambiguous', matches };
      target = matches[0];
    } else {
      throw new Error('Không xác định được lịch — thêm tên môn hoặc dùng "#ID" nhé!');
    }

    // When only time changes, keep the existing date
    if (changes.remindAt && changes.remindAt.length === 8) {
      // pure "HH:MM:SS" — prepend existing date
      changes.remindAt = `${TimeUtils.dateOf(target.remind_at)} ${changes.remindAt}`;
    }

    const ok = await this.#scheduleRepo.update(target.id, userId, changes);
    if (!ok) return { status: 'not_found' };

    const updated = await this.#scheduleRepo.findById(target.id);
    console.log(`[Scheduler] Updated #${target.id} | changes=${JSON.stringify(changes)}`);
    return { status: 'updated', schedule: updated };
  }

  /**
   * Fast regex-based parse for simple "#ID time" patterns — no AI call needed.
   * Handles: "#5 8h30pm", "#5 20:30", "#5 ngày 15/03 9h"
   * Returns null if pattern not matched (fall back to Gemini).
   * @param {string} text
   * @param {string} tz
   * @returns {{ id: number, remind_at: string }|null}
   */
  static #fastParseEdit(text, tz) {
    // Must have #ID
    const idMatch = text.match(/#(\d+)/);
    if (!idMatch) return null;
    const id = Number(idMatch[1]);

    // Extract time: "8h30pm", "8h30", "8:30pm", "8:30", "20:30", "20h30"
    const timeMatch = text.match(/(\d{1,2})[h:](\d{0,2})\s*(pm|am)?/i);
    if (!timeMatch) return null;

    let hour   = Number(timeMatch[1]);
    const min  = Number(timeMatch[2] || 0);
    const ampm = (timeMatch[3] || '').toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    const hhmm = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;

    // Extract date if present: "ngày 15/03" or "15/03/2026"
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/);
    let datePart = null;
    if (dateMatch) {
      const dd   = dateMatch[1].padStart(2, '0');
      const mm   = dateMatch[2].padStart(2, '0');
      const yyyy = dateMatch[3] || TimeUtils.todayString(tz).slice(0, 4);
      datePart = `${yyyy}-${mm}-${dd}`;
    }

    // remind_at: full if date found, else time-only (caller will prepend existing date)
    const remind_at = datePart ? `${datePart} ${hhmm}` : hhmm;

    return { id, remind_at, search_keyword: null, title: null, repeat_type: null };
  }

  /**
   * Persist the notification channel ID in config.
   * @param {string} channelId
   */
  async setNotificationChannel(channelId) {
    await this.#configRepo.set('schedule_discord_channel_id', channelId);
  }

  /**
   * Parse bulk structured schedule text and persist all entries.
   * Expects lines like: "Ngày DD/MM/YYYY học <subject> giờ HH:MM - HH:MM"
   *
   * @param {string} text   — multiline schedule block
   * @param {string} userId
   * @param {string} username
   * @param {string} channelId
   * @param {string} platform
   * @returns {Promise<{created: number, skipped: number, lines: string[]}>}
   */
  async parseAndCreateBulk(text, userId, username, channelId, platform) {
    // Match: Ngày DD/MM/YYYY học <subject> giờ HH:MM - HH:MM
    const LINE_RE = /ng[aà]y\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+h[oọ]c\s+(.+?)\s+gi[oờ]+\s+(\d{1,2}:\d{2})\s*[-–]\s*\d{1,2}:\d{2}/gi;

    const entries = [];
    let m;
    while ((m = LINE_RE.exec(text)) !== null) {
      const [, datePart, subject, startTime] = m;
      const [dd, mm, yyyy] = datePart.split('/');
      const remindAt = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')} ${startTime}:00`;
      entries.push({ title: subject.trim(), remindAt, repeatType: 'none' });
    }

    if (!entries.length) {
      throw new Error('Không tìm thấy lịch nào theo định dạng "Ngày DD/MM/YYYY học ... giờ HH:MM - HH:MM"');
    }

    let created = 0;
    let skipped = 0;
    const lines = [];

    for (const entry of entries) {
      try {
        const id = await this.#scheduleRepo.create({
          userId,
          username:  username  || null,
          platform:  platform  || 'discord',
          channelId: channelId || null,
          title:     entry.title,
          remindAt:  entry.remindAt,
          repeatType: entry.repeatType,
        });
        created++;
        lines.push(`✅ #${id} ${entry.title} — ${entry.remindAt}`);
        console.log(`[Scheduler] Bulk created #${id} | "${entry.title}" at ${entry.remindAt}`);
      } catch (err) {
        skipped++;
        lines.push(`❌ ${entry.title} — ${err.message}`);
      }
    }

    return { created, skipped, lines };
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

    const tz      = this.#configRepo.get('schedule_timezone') || 'Asia/Ho_Chi_Minh';
    const nowStr  = TimeUtils.promptNow(tz);

    const prompt = `Hôm nay là ${nowStr}. Parse lịch từ text sau (tiếng Việt).
Text: "${text}"
Trả về JSON: { "title": "...", "remind_at": "YYYY-MM-DD HH:MM:SS" (giờ ${tz}), "repeat_type": "none|daily|weekly" }
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
   * Human-readable repeat label.
   * remindAt is a local-timezone datetime string — parse components directly.
   * @param {string} repeatType
   * @param {string} remindAt  "YYYY-MM-DD HH:MM:SS" (local tz)
   */
  #repeatLabel(repeatType, remindAt) {
    const hhmm = TimeUtils.timeOf(remindAt);
    // Compute day-of-week from date components (UTC constructor avoids local-tz shift)
    const datePart = TimeUtils.dateOf(remindAt);
    const [yyyy, mm, dd] = datePart.split('-').map(Number);
    const dow = new Date(Date.UTC(yyyy, mm - 1, dd)).getUTCDay();
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    if (repeatType === 'weekly') return `Hàng tuần (${days[dow]} ${hhmm})`;
    if (repeatType === 'daily')  return `Hàng ngày (${hhmm})`;
    return `Một lần (${days[dow]} ${hhmm})`;
  }
}

module.exports = SchedulerService;
