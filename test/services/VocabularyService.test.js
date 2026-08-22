'use strict';

const VocabularyService = require('../../src/services/learning/VocabularyService');

describe('VocabularyService', () => {
  let mockVocabRepo;
  let mockConfigRepo;
  let configStore;
  let service;

  beforeEach(() => {
    configStore = {
      vocab_enabled: 'true',
      notify_vocab_enabled: 'true',
      vocab_daily_time: '08:00',
      vocab_words_per_day: '5',
      vocab_discord_channel_id: '1234567890',
      schedule_discord_channel_id: '9876543210',
      vocab_topic_mode: 'sequential',
      vocab_current_topic_no: '1',
      vocab_last_sent_date: '',
    };

    mockConfigRepo = {
      get: (k) => configStore[k] ?? null,
      set: async (k, v) => { configStore[k] = v; },
    };

    mockVocabRepo = {
      findWords: jest.fn().mockResolvedValue([
        { id: 1, word: 'resilience', meaning: 'kiên cường', is_sent: 0 },
      ]),
      pickUnsentWords: jest.fn().mockImplementation((topicNo, count) => {
        if (topicNo === 2) {
          return Promise.resolve([
            { id: 10, word: 'innovation', meaning: 'đổi mới', topic_no: 2, topic_name: 'Tech', is_sent: 0 },
          ]);
        }
        return Promise.resolve([]);
      }),
      findLogs: jest.fn().mockResolvedValue([]),
      logSend: jest.fn().mockResolvedValue(true),
    };

    service = new VocabularyService(mockVocabRepo, mockConfigRepo);
  });

  test('getConfig unifies vocab_enabled and notify_vocab_enabled', () => {
    const cfg = service.getConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.discord_channel_id).toBe('1234567890');
    expect(cfg.current_topic_no).toBe(1);
  });

  test('updateConfig syncs both vocab_enabled and notify_vocab_enabled', async () => {
    await service.updateConfig({ enabled: false, words_per_day: 10 });
    expect(configStore.vocab_enabled).toBe('false');
    expect(configStore.notify_vocab_enabled).toBe('false');
    expect(configStore.vocab_words_per_day).toBe('10');
  });

  test('buildDailyPayload rotates sequentially across topics if current topic has no unsent words', async () => {
    const payload = await service.buildDailyPayload();
    expect(payload.words.length).toBe(1);
    expect(payload.words[0].word).toBe('innovation');
    expect(configStore.vocab_current_topic_no).toBe('2');
  });

  test('isDue checks time and last sent date properly', async () => {
    const due = await service.isDue('2026-08-16 09:00:00');
    expect(due).toBe(true);

    const notDueYet = await service.isDue('2026-08-16 07:00:00');
    expect(notDueYet).toBe(false);

    await service.markDailyAttempt('2026-08-16');
    const alreadySentToday = await service.isDue('2026-08-16 09:00:00');
    expect(alreadySentToday).toBe(false);
  });
});
