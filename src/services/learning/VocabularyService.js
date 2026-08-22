'use strict';

const TimeUtils = require('../../utils/TimeUtils');

/**
 * Daily vocabulary notification workflow.
 */
class VocabularyService {
  /** @type {import('../models/VocabularyRepository')} */
  #vocabRepo;
  /** @type {import('../models/ConfigRepository')} */
  #configRepo;

  /**
   * @param {import('../models/VocabularyRepository')} vocabRepo
   * @param {import('../models/ConfigRepository')} configRepo
   */
  constructor(vocabRepo, configRepo) {
    this.#vocabRepo = vocabRepo;
    this.#configRepo = configRepo;
  }

  getConfig() {
    const rawVocabEnabled = this.#configRepo.get('vocab_enabled');
    const rawNotifyEnabled = this.#configRepo.get('notify_vocab_enabled');
    const enabled = rawVocabEnabled !== null
      ? (rawVocabEnabled === 'true' || rawNotifyEnabled === 'true')
      : (rawNotifyEnabled !== 'false');

    return {
      enabled,
      notify_vocab_enabled: enabled,
      daily_time: this.#configRepo.get('vocab_daily_time') || '08:00',
      words_per_day: Number(this.#configRepo.get('vocab_words_per_day') || 5),
      discord_channel_id: this.#configRepo.get('vocab_discord_channel_id') || this.#configRepo.get('schedule_discord_channel_id') || '',
      topic_mode: this.#configRepo.get('vocab_topic_mode') || 'sequential',
      current_topic_no: Number(this.#configRepo.get('vocab_current_topic_no') || 1),
      last_sent_date: this.#configRepo.get('vocab_last_sent_date') || '',
      timezone: this.#configRepo.get('schedule_timezone') || 'Asia/Ho_Chi_Minh',
    };
  }

  /** @param {object} data */
  async updateConfig(data) {
    const isEnabled = data.enabled !== undefined ? data.enabled : data.notify_vocab_enabled;
    const enabledVal = isEnabled !== undefined ? (isEnabled ? 'true' : 'false') : undefined;

    const writes = {
      vocab_enabled: enabledVal,
      notify_vocab_enabled: enabledVal,
      vocab_daily_time: data.daily_time,
      vocab_words_per_day: data.words_per_day !== undefined ? String(data.words_per_day) : undefined,
      vocab_discord_channel_id: data.discord_channel_id,
      vocab_topic_mode: data.topic_mode,
      vocab_current_topic_no: data.current_topic_no !== undefined ? String(data.current_topic_no) : undefined,
    };
    for (const [key, value] of Object.entries(writes)) {
      if (value !== undefined) await this.#configRepo.set(key, value);
    }
  }

  /**
   * True when today's notification window is due and has not sent today.
   * @param {string} nowStr YYYY-MM-DD HH:MM:SS
   */
  async isDue(nowStr) {
    const cfg = this.getConfig();
    if (!cfg.enabled) return false;
    const today = TimeUtils.dateOf(nowStr);
    const nowTime = TimeUtils.timeOf(nowStr);
    if (nowTime < cfg.daily_time) return false;
    if (cfg.last_sent_date === today) return false;
    const logs = await this.#vocabRepo.findLogs(today, 1);
    return !logs.some((row) => row.status === 'sent');
  }

  /** @param {string} dateStr YYYY-MM-DD */
  async markDailyAttempt(dateStr) {
    await this.#configRepo.set('vocab_last_sent_date', dateStr);
  }

  /**
   * Build the next daily vocabulary payload.
   */
  async buildDailyPayload() {
    const cfg = this.getConfig();
    let topicNo = Math.max(1, Math.min(50, Number(cfg.current_topic_no) || 1));
    const count = Math.max(1, Math.min(50, Number(cfg.words_per_day) || 5));
    let words = await this.#vocabRepo.pickUnsentWords(topicNo, count);

    if (!words.length && cfg.topic_mode === 'sequential') {
      for (let attempt = 1; attempt <= 50; attempt++) {
        topicNo = topicNo >= 50 ? 1 : topicNo + 1;
        words = await this.#vocabRepo.pickUnsentWords(topicNo, count);
        if (words.length) {
          await this.#configRepo.set('vocab_current_topic_no', String(topicNo));
          break;
        }
      }
    }

    return { config: this.getConfig(), words };
  }

  /**
   * Mark all selected words after a send attempt.
   * @param {object[]} words
   * @param {{ status: 'sent'|'failed', error?: string, channelId?: string, nowStr?: string }} data
   */
  async logWords(words, data) {
    const tz = this.#configRepo.get('schedule_timezone') || 'Asia/Ho_Chi_Minh';
    const nowStr = data.nowStr || TimeUtils.nowString(tz);
    const today = TimeUtils.dateOf(nowStr);
    for (const word of words) {
      await this.#vocabRepo.logSend(word.id, word.topic_id, today, {
        status: data.status,
        error: data.error,
        channelId: data.channelId,
        sentAt: data.status === 'sent' ? nowStr : null,
      });
    }
  }

  /** @param {object[]} words */
  formatDiscordMessage(words) {
    if (!words.length) {
      return "📚 **Today's Vocabulary**\nNo new words to send. Please check your vocabulary list on the dashboard.";
    }
    const topic = words[0];
    const wordBlocks = words.map((w, i) => {
      const pronStr = w.pronunciation?.trim() ? ` \`/${w.pronunciation.trim().replace(/^\/|\/$/g, '')}/\`` : '';
      const line1 = `📖 Word #${i + 1}: **${w.word}**${pronStr}`;
      const line2 = `💡 Meaning: ${w.meaning}`;
      const line3 = `Ex: ${w.example || 'No example available'}`;
      const line4 = `Trans: ${w.note || 'No translation available'}`;
      return [line1, line2, line3, line4].join('\n');
    });
    return [
      "📚 **TODAY'S VOCABULARY LESSON**",
      `Topic ${topic.topic_no}: **${topic.topic_name}**`,
      '──────────────',
      wordBlocks.join('\n\n──────────────\n'),
    ].join('\n');
  }

  /**
   * Fetch standard US IPA pronunciation for a given English word.
   * @param {string} word
   * @returns {Promise<string|null>}
   */
  async fetchUsPronunciation(word) {
    const cleanWord = String(word || '').trim();
    if (!cleanWord) return null;

    const baseUrl = this.#configRepo.get('vocab_dictionary_api_url')
      || process.env.DICTIONARY_API_URL
      || 'https://api.dictionaryapi.dev/api/v2/entries/en';

    try {
      const url = `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(cleanWord)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        for (const entry of data) {
          if (entry.phonetic) return entry.phonetic.replace(/^\/|\/$/g, '').trim();
          for (const p of entry.phonetics || []) {
            if (p.text) return p.text.replace(/^\/|\/$/g, '').trim();
          }
        }
      }
    } catch (_) {}
    return null;
  }

  /**
   * Auto-fill US phonetic pronunciations for all words missing pronunciation in the database.
   * Processes in concurrent batches of 10 for maximum speed.
   */
  async fillMissingPronunciations() {
    const missingWords = await this.#vocabRepo.findMissingPronunciationWords();
    if (!missingWords.length) {
      return { total: 0, updated: 0, failed: 0 };
    }

    let updated = 0;
    let failed = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < missingWords.length; i += BATCH_SIZE) {
      const batch = missingWords.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (row) => {
        const pron = await this.fetchUsPronunciation(row.word);
        if (pron) {
          await this.#vocabRepo.updateWord(row.id, { pronunciation: pron });
          updated++;
        } else {
          failed++;
        }
      }));
    }

    return { total: missingWords.length, updated, failed };
  }

  /** @type {import('discord.js').Client|null} */
  #discordClient = null;

  setDiscordClient(client) {
    this.#discordClient = client;
  }

  /**
   * Send a specific word to Discord if it hasn't been sent before.
   * @param {number} wordId
   */
  async sendSingleWordToDiscord(wordId) {
    const id = Number(wordId);
    if (!id) throw new TypeError('Invalid word ID');

    const words = await this.#vocabRepo.findWords(null, { limit: 1000, includeInactive: true });
    const word = words.find((w) => Number(w.id) === id);
    if (!word) throw new Error(`Word #${id} not found`);

    if (Number(word.is_sent) === 1) {
      return { ok: false, alreadySent: true, error: `Từ "${word.word}" đã được gửi qua Discord trước đó rồi!` };
    }

    const cfg = this.getConfig();
    const channelId = cfg.discord_channel_id || this.#configRepo.get('schedule_discord_channel_id');
    if (!channelId) {
      throw new Error('Chưa cấu hình Discord Channel ID trong phần Vocabulary Config hoặc Scheduler Config');
    }

    const message = this.formatDiscordMessage([word]);

    let sent = false;
    if (this.#discordClient) {
      try {
        const channel = await this.#discordClient.channels.fetch(channelId).catch(() => null);
        if (channel?.isTextBased?.()) {
          await channel.send(message);
          sent = true;
        }
      } catch (_) {}
    }

    if (!sent) {
      const token = process.env.DISCORD_TOKEN || this.#configRepo.get('discord_token');
      if (!token) {
        throw new Error('Chưa cấu hình DISCORD_TOKEN trong file .env');
      }

      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: message }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gửi tin nhắn Discord thất bại (${res.status}): ${errText.slice(0, 100)}`);
      }
    }

    await this.logWords([word], {
      status: 'sent',
      channelId,
    });

    return { ok: true, wordId: word.id, word: word.word, message: `Đã gửi từ "${word.word}" qua Discord thành công!` };
  }
}

module.exports = VocabularyService;
