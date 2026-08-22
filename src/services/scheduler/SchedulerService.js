'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const TimeUtils = require('../../utils/TimeUtils');

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
  /** @type {import('./VocabularyService')|null} */
  #vocabService = null;

  /**
   * @param {import('../models/ScheduleRepository')} scheduleRepo
   * @param {import('../models/ConfigRepository')} configRepo
   */
  constructor(scheduleRepo, configRepo, vocabService = null) {
    this.#scheduleRepo = scheduleRepo;
    this.#configRepo   = configRepo;
    this.#vocabService = vocabService;
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
    this.#log('started', { intervalMs: 60_000, timezone: this.getTimezone() });
  }

  /**
   * Keep schedule logs searchable while making the caller explicit. The
   * application logger persists console output to the daily log file.
   * @param {string} event
   * @param {object} context
   */
  #log(event, context = {}) {
    console.log(`[Schedule] ${JSON.stringify({ event, ...context })}`);
  }

  async #tick() {
    try {
      const tz     = this.#configRepo.get('schedule_timezone') || 'Asia/Ho_Chi_Minh';
      const nowStr = TimeUtils.nowString(tz);

      // Stage 1: advance notice 1 hour before
      const in60Str = TimeUtils.addMinutes(nowStr, 60);
      const rows1h  = await this.#scheduleRepo.findAdvance(nowStr, in60Str, 'notified_1h');
      for (const row of rows1h) {
        await this.#sendAdvanceNotification(row, '1 tiếng', 'notified_1h');
      }

      // Stage 2: advance notice 30 minutes before
      const in30Str = TimeUtils.addMinutes(nowStr, 30);
      const rows30m = await this.#scheduleRepo.findAdvance(nowStr, in30Str, 'notified_30m');
      for (const row of rows30m) {
        await this.#sendAdvanceNotification(row, '30 phút', 'notified_30m');
      }

      // Stage 3: fire due reminders
      const rowsDue = await this.#scheduleRepo.findUpcoming(nowStr);
      this.#log('tick', {
        source: 'schedule',
        now: nowStr,
        timezone: tz,
        advance1h: rows1h.length,
        advance30m: rows30m.length,
        due: rowsDue.length,
      });
      for (const row of rowsDue) {
        await this.#fireReminder(row);
      }

      // Stage 4: daily vocabulary notification
      if (this.#vocabService && await this.#vocabService.isDue(nowStr)) {
        this.#log('due', { source: 'schedule', type: 'daily_vocabulary', now: nowStr });
        await this.#sendDailyVocabulary(nowStr);
      }
    } catch (err) {
      console.error('[Schedule] ' + JSON.stringify({ event: 'tick_error', source: 'schedule', error: err.message }), err);
    }
  }

  /**
   * Send daily vocabulary words through the configured Discord channel.
   * @param {string} nowStr
   */
  async #sendDailyVocabulary(nowStr) {
    const { config, words } = await this.#vocabService.buildDailyPayload();
    const channelId = config.discord_channel_id || this.#configRepo.get('schedule_discord_channel_id');
    if (!channelId) {
      console.warn('[Vocabulary] No Discord channel configured');
      this.#log('send_failed', { source: 'schedule', type: 'daily_vocabulary', reason: 'channel_not_configured', words: words.length });
      if (words.length) {
        await this.#vocabService.logWords(words, {
          status: 'failed',
          error: 'No Discord channel configured',
          nowStr,
        });
      }
      return;
    }

    // Build full message and split into 2000-char chunks.
    const fullMessage = this.#vocabService.formatDiscordMessage(words);
    const MAX_LENGTH = 2000;
    const chunks = [];
    if (fullMessage.length <= MAX_LENGTH) {
      chunks.push(fullMessage);
    } else {
      const lines = fullMessage.split('\n');
      let current = '';
      for (const line of lines) {
        const addition = (current ? '\n' : '') + line;
        if ((current + addition).length > MAX_LENGTH) {
          if (current) chunks.push(current);
          // If a single line exceeds limit, split it.
          if (line.length > MAX_LENGTH) {
            for (let i = 0; i < line.length; i += MAX_LENGTH) {
              chunks.push(line.slice(i, i + MAX_LENGTH));
            }
            current = '';
          } else {
            current = line;
          }
        } else {
          current += addition;
        }
      }
      if (current) chunks.push(current);
    }

    let sentAll = true;
    let sendError = null;
    const sendChunk = async (msgChunk) => {
      // Try Discord client first.
      if (this.#discordClient) {
        try {
          const channel = await this.#discordClient.channels.fetch(channelId).catch(() => null);
          if (channel?.isTextBased?.() || channel?.send) {
            await channel.send(msgChunk);
            return true;
          }
        } catch (err) {
          sendError = err.message;
          console.warn('[Schedule] Discord client send error, attempting REST fallback:', err.message);
        }
      }
      // Fallback to REST API.
      const token = process.env.DISCORD_TOKEN || this.#configRepo.get('discord_token');
      if (token) {
        try {
          const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: msgChunk }),
          });
          if (res.ok) {
            return true;
          } else {
            const errText = await res.text().catch(() => '');
            sendError = `REST ${res.status}: ${errText.slice(0, 100)}`;
          }
        } catch (fetchErr) {
          sendError = fetchErr.message;
        }
      }
      return false;
    };

    for (const chunk of chunks) {
      const ok = await sendChunk(chunk);
      if (!ok) {
        sentAll = false;
        break;
      }
    }

    if (sentAll) {
      await this.#vocabService.markDailyAttempt(TimeUtils.dateOf(nowStr));
      await this.#vocabService.logWords(words, { status: 'sent', channelId, nowStr });
      this.#log('sent', { source: 'schedule', type: 'daily_vocabulary', words: words.length, channelId, now: nowStr });
    } else {
      console.error('[Schedule] ' + JSON.stringify({ event: 'send_failed', source: 'schedule', type: 'daily_vocabulary', words: words.length, channelId, error: sendError || 'Discord delivery failed' }));
      if (words.length) {
        await this.#vocabService.logWords(words, {
          status: 'failed',
          error: sendError || 'Discord client not ready and REST API failed',
          channelId,
          nowStr,
        });
      }
    }
  }

  /**
   * Send an advance notification (1h or 30m before) and mark it as sent.
   * @param {object} row
   * @param {string} label      e.g. "1 tiếng" | "30 phút"
   * @param {string} notifyCol  'notified_1h' | 'notified_30m'
   */
  async #sendAdvanceNotification(row, label, notifyCol) {
    this.#log('advance', { source: 'schedule', scheduleId: row.id, label, userId: row.user_id, title: row.title });
    try {
      if (!this.#discordClient) return;

      const channelId = row.channel_id || this.#configRepo.get('schedule_discord_channel_id');
      if (!channelId) return;

      const channel = await this.#discordClient.channels.fetch(channelId).catch(() => null);
      if (!channel) return;

      const hhmm    = TimeUtils.timeOf(row.remind_at);
      const message = [
        `⏰ **Nhắc trước ${label}!**`,
        `👤 <@${row.user_id}>`,
        `📌 ${row.title}`,
        `🕐 Bắt đầu lúc **${hhmm}**`,
      ].join('\n');

      await channel.send(message);
      this.#log('advance_sent', { source: 'schedule', scheduleId: row.id, label, channelId });
    } catch (err) {
      console.error('[Schedule] ' + JSON.stringify({ event: 'advance_failed', source: 'schedule', scheduleId: row.id, label, error: err.message }));
    }

    await this.#scheduleRepo.markNotified(row.id, notifyCol);
  }

  /**
   * Send reminder notification and update schedule.
   * @param {object} row  - schedule DB row
   */
  async #fireReminder(row) {
    this.#log('fire', { source: 'schedule', scheduleId: row.id, userId: row.user_id, title: row.title, repeatType: row.repeat_type });
    try {
      await this.#sendDiscordNotification(row);
    } catch (err) {
      console.error('[Schedule] ' + JSON.stringify({ event: 'fire_failed', source: 'schedule', scheduleId: row.id, error: err.message }));
    }

    let nextRemindAt = null;
    if (row.repeat_type === 'daily') {
      nextRemindAt = TimeUtils.addDays(row.remind_at, 1);
    } else if (row.repeat_type === 'weekly') {
      nextRemindAt = TimeUtils.addDays(row.remind_at, 7);
    }
    await this.#scheduleRepo.markFired(row.id, nextRemindAt);
    this.#log('marked', { source: 'schedule', scheduleId: row.id, nextRemindAt });
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
      console.warn(`[Schedule] Channel ${channelId} not found for schedule #${row.id}`);
      return;
    }

    const repeatLabel = this.#repeatLabel(row.repeat_type, row.remind_at);
    const message = [
      '⏰ **THÔNG BÁO LỊCH HỌC**',
      `👤 **Học viên:** <@${row.user_id}>`,
      `📌 **Nội dung:** ${row.title}`,
      `🔁 **Lặp lại:** ${repeatLabel}`,
    ].join('\n');

    await channel.send(message);
    this.#log('sent', { source: 'schedule', type: 'schedule_reminder', scheduleId: row.id, channelId });
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
   * Structured scheduler boundary used by the OpenClaw schedule tool.
   * Natural-language interpretation belongs to the model; persistence and
   * ownership checks stay deterministic here.
   */
  async manage({ operation, userId, username, channelId, platform, scheduleId, title, remindAt, repeatType, date, source = 'openclaw' }) {
    const owner = { userId, platform: platform || 'discord' };
    this.#log('manage_start', { source, operation, scheduleId, userId, platform: owner.platform, title, remindAt });
    switch (operation) {
      case 'list':
        const schedules = date
          ? { operation, schedules: await this.listByDate(userId, owner.platform, date) }
          : { operation, schedules: await this.listByUser(userId, owner.platform) };
        this.#log('manage_success', { source, operation, userId, date, count: schedules.schedules.length });
        return schedules;
      case 'create': {
        if (!title || !remindAt) throw new TypeError('Schedule create requires title and remindAt');
        const id = await this.#scheduleRepo.create({
          userId,
          username: username || null,
          platform: owner.platform,
          channelId: channelId || null,
          title,
          remindAt,
          repeatType: repeatType || 'none',
        });
        const result = { operation, schedule: { id, title, remindAt, repeatType: repeatType || 'none' } };
        this.#log('manage_success', { source, operation, scheduleId: id, userId });
        return result;
      }
      case 'update': {
        if (!scheduleId) throw new TypeError('Schedule update requires scheduleId');
        const updated = await this.#scheduleRepo.update(scheduleId, userId, {
          title: title || null,
          remindAt: remindAt || null,
          repeatType: repeatType || null,
        });
        if (!updated) return { operation, status: 'not_found' };
        const result = { operation, status: 'updated', schedule: await this.#scheduleRepo.findById(scheduleId) };
        this.#log('manage_success', { source, operation, scheduleId, userId });
        return result;
      }
      case 'delete': {
        if (!scheduleId) throw new TypeError('Schedule delete requires scheduleId');
        const deleted = await this.deleteSchedule(scheduleId, userId);
        this.#log('manage_success', { source, operation, scheduleId, userId, deleted });
        return { operation, deleted, scheduleId };
      }
      default:
        throw new TypeError('Schedule operation must be create, list, update, or delete');
    }
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
    const tz   = this.getTimezone();
    const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

    // ── Bulk path: "toàn bộ / tất cả" → update all matching schedules ──
    if (/toan\s*bo|tat\s*ca|het|all/.test(norm)) {
      return this.#applyBulkTimeUpdate(text, norm, userId, platform, tz);
    }

    // ── Fast path: regex for simple "#ID <time>" or "#ID <date> <time>" ──
    const fastParsed = SchedulerService.#fastParseEdit(text, tz);
    if (fastParsed) {
      console.log('[Schedule] parseAndUpdate fast-path:', JSON.stringify(fastParsed));
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

    try {
      const result = await model.generateContent(prompt);
      const raw    = result.response.text().trim();
      console.log('[Schedule] parseAndUpdate Gemini response:', raw);

      let parsed;
      try {
        const jsonStr   = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : jsonStr);
      } catch {
        throw new Error('Gemini không trả về JSON hợp lệ');
      }

      // Normalize Gemini fields
      const normalized = {
        id:             parsed.id            || null,
        search_keyword: parsed.search_keyword || null,
        title:          parsed.title         || null,
        remind_at:      parsed.remind_at     || parsed.remindAt  || null,
        repeat_type:    parsed.repeat_type   || parsed.repeatType || null,
      };

      if (normalized.id || normalized.search_keyword || normalized.title || normalized.remind_at || normalized.repeat_type) {
        return await this.#applyUpdate(normalized, userId, platform);
      }

      throw new Error('Gemini không tìm thấy thông tin đủ rõ');
    } catch (err) {
      const fallback = SchedulerService.#fallbackParseUpdate(text, tz);
      console.warn(`[Schedule] Gemini parse failed, falling back to heuristic parse: ${err.message}`);
      return this.#applyUpdate(fallback, userId, platform);
    }
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
      if (!target) {
        console.warn(`[Schedule] applyUpdate not_found: no schedule id=${p.id}`);
        return { status: 'not_found' };
      }
      if (target.user_id !== userId) {
        console.warn(`[Schedule] applyUpdate not_found: owner mismatch id=${p.id} owner=${target.user_id} requester=${userId}`);
        return { status: 'not_found' };
      }
    } else if (p.search_keyword) {
      const matches = await this.#scheduleRepo.findByKeyword(userId, platform, p.search_keyword);
      if (!matches.length) {
        console.warn(`[Schedule] applyUpdate not_found: keyword="${p.search_keyword}" user=${userId}`);
        return { status: 'not_found' };
      }
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
    if (!ok) {
      console.warn(`[Schedule] applyUpdate update failed id=${target.id} (inactive or no changes)`);
      return { status: 'not_found' };
    }

    const updated = await this.#scheduleRepo.findById(target.id);
    console.log(`[Schedule] Updated #${target.id} | changes=${JSON.stringify(changes)}`);
    return { status: 'updated', schedule: updated };
  }

  /**
   * Bulk-update time for all schedules whose title matches a keyword.
   * Triggered when user says "toàn bộ / tất cả".
   * Keeps each schedule's existing date, only changes the time component.
   */
  async #applyBulkTimeUpdate(text, _norm, userId, platform, _tz) {
    // Extract time from text: "8h30pm", "20:30", "8h30"
    const timeMatch = text.match(/(\d{1,2})[h:](\d{0,2})\s*(pm|am)?/i);
    if (!timeMatch) throw new Error('Không tìm thấy giờ mới — vd: "toàn bộ 8h30pm"');

    let hour  = Number(timeMatch[1]);
    const min = Number(timeMatch[2] || 0);
    const ap  = (timeMatch[3] || '').toLowerCase();
    if (ap === 'pm' && hour < 12) hour += 12;
    if (ap === 'am' && hour === 12) hour = 0;
    const newTimePart = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;

    // Extract keyword: text between "lịch" and time/toàn bộ/tất cả keywords
    // Strip command words to get the subject keyword
    const stripped = text
      .replace(/đần\s*/i, '')
      .replace(/(chinh\s*sua|sua|cap\s*nhat)\s*(lich|reminder|nhac)/i, '')
      .replace(/toan\s*bo|tat\s*ca|het|all/gi, '')
      .replace(/(\d{1,2})[h:](\d{0,2})\s*(pm|am)?/gi, '')
      .replace(/ngay\s*\d.*$/gi, '')
      .trim();

    const keyword = stripped.replace(/^[\s\-–:,]+|[\s\-–:,]+$/g, '').trim();
    if (!keyword) throw new Error('Không rõ cần sửa lịch nào — thêm tên môn/việc vào nhé!');

    console.log(`[Schedule] Bulk time update | keyword="${keyword}" newTime=${newTimePart}`);

    const affected = await this.#scheduleRepo.updateTimeByKeyword(userId, platform, keyword, newTimePart);
    if (!affected) return { status: 'not_found' };

    const updated = await this.#scheduleRepo.findByKeyword(userId, platform, keyword);
    console.log(`[Schedule] Bulk updated ${affected} schedules | keyword="${keyword}"`);
    return { status: 'bulk_updated', count: affected, schedules: updated, keyword };
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
   * Heuristic fallback when Gemini is unavailable or returns unusable output.
   * Tries to recover an id or a keyword from the command text.
   * @param {string} text
   * @param {string} tz
   * @returns {{ id?: number|null, search_keyword?: string|null, title?: string|null, remind_at?: string|null, repeat_type?: string|null }}
   */
  static #fallbackParseUpdate(text, tz) {
    const idMatch = text.match(/#(\d+)/);
    const id = idMatch ? Number(idMatch[1]) : null;

    const cleaned = text
      .replace(/đần/ig, '')
      .replace(/#\d+/g, '')
      .replace(/(chinh\s*sua|sua|cap\s*nhat)\s*(lich|reminder|nhac)?/ig, '')
      .replace(/(lich|reminder|nhac)/ig, '')
      .replace(/(\d{1,2})[h:](\d{0,2})\s*(pm|am)?/ig, '')
      .replace(/ngay\s*\d.*$/ig, '')
      .replace(/^[\s\-–:,]+|[\s\-–:,]+$/g, '')
      .trim();

    return {
      id,
      search_keyword: cleaned || null,
      title: null,
      remind_at: null,
      repeat_type: null,
    };
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
        console.log(`[Schedule] Bulk created #${id} | "${entry.title}" at ${entry.remindAt}`);
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
      console.warn('[Schedule] Missing title, parsed:', JSON.stringify(parsed));
      throw new Error('Không parse được tiêu đề lịch — thử diễn đạt lại nhé!');
    }
    if (!remindAt) {
      console.warn('[Schedule] Missing remindAt, parsed:', JSON.stringify(parsed));
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

    console.log(`[Schedule] Created #${id} | user=${username}(${userId}) title="${title}" at=${remindAt} repeat=${repeatType}`);
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
    console.log('[Schedule] Gemini parse response:', raw);

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
