'use strict';

const assert = require('assert');
const LearningService = require('../../src/services/learning/LearningService');

describe('LearningService', () => {
  let service;
  let mockLearningRepo;
  let mockAiService;
  let mockConfigRepo;
  let configStore;

  beforeEach(() => {
    configStore = {
      notify_vocab_enabled: 'true',
      notify_tech_enabled: 'false',
      notify_quiz_enabled: 'false',
      notify_ielts_enabled: 'false',
      vocab_daily_time: '08:00',
      vocab_words_per_day: '5',
      vocab_discord_channel_id: '123456789',
    };

    mockConfigRepo = {
      get: (k) => configStore[k] ?? null,
      set: async (k, v) => { configStore[k] = v; },
    };

    mockLearningRepo = {
      findLearningBySlug: async (slug) => ({ id: 10, slug, name: slug.toUpperCase(), category_id: 1 }),
      findLearningById: async (id) => ({ id, slug: 'topic-1', name: 'Topic 1', category_id: 2 }),
      findItems: async () => [
        {
          id: 1,
          type: 'vocabulary',
          title: 'Perseverance',
          content: { meaning: 'Kiên trì', pronunciation: '/ˌpɜː.sɪˈvɪə.rəns/' },
          is_sent: 0,
        },
      ],
      findItemById: async (id) => ({
        id,
        type: id === 99 ? 'ielts' : 'tech_question',
        title: 'Explain Event Loop in Node.js',
        prompt: 'How does Libuv handle timers and microtasks?',
        content: { quick_answer: 'Single threaded event-driven architecture with libuv thread pool' },
        learning_name: 'Node.js',
      }),
      createItem: async (data) => 101,
      upsertMetadata: async () => true,
      markItemSent: async () => true,
    };

    mockAiService = {
      chatOnce: async (messages) => {
        const text = messages[0].content;
        if (text.includes('Senior Technical Architect') && text.includes('Lead Interviewer')) {
          return JSON.stringify({
            title: 'Event Loop & Phase Hierarchy',
            prompt: 'Explain microtask queue vs macrotask queue in Node.js',
            level: 'intermediate',
            content: {
              quick_answer: 'process.nextTick has higher priority than Promise.then()',
              detailed_answer: 'Node.js maintains nextTickQueue and microTaskQueue between phases',
              code_example: 'process.nextTick(() => console.log(1));',
              interview_tips: 'Common trap is starvation of I/O events',
              practical_tips: 'Avoid recursive nextTick calls',
            },
            sample_solution: { key_takeaways: 'Microtasks run immediately after current operation' },
            tags: 'nodejs, interview',
          });
        }
        if (text.includes('Master of Applied Linguistics') && text.includes('chủ đề')) {
          return JSON.stringify([
            {
              title: 'Meticulous',
              prompt: 'Showing great attention to detail',
              level: 'intermediate',
              content: {
                word: 'Meticulous',
                meaning: 'Tỉ mỉ, cẩn thận từng chi tiết',
                pronunciation: '/məˈtɪk.jə.ləs/',
                example: 'He is meticulous about code quality and testing.',
                note: 'Anh ấy rất tỉ mỉ về chất lượng mã nguồn và kiểm thử.',
                collocations: ['meticulous attention', 'meticulous planning'],
                mnemonics: 'Meticulous ~ tỉ mỉ',
              },
              sample_solution: { synonyms: ['thorough', 'diligent'] },
              tags: 'vocabulary, topic 1',
            },
          ]);
        }
        if (text.includes('Cambridge IELTS Senior Examiner') || text.includes('IELTS')) {
          return JSON.stringify({
            overall_band: 7.5,
            criteria_scores: {
              task_achievement: 7.5,
              coherence_cohesion: 7.0,
              lexical_resource: 8.0,
              grammatical_range_accuracy: 7.5,
            },
            strengths: ['Clear structure and academic vocabulary'],
            grammar_corrections: [],
            better_vocabulary: [{ word: 'good', upgrade: 'beneficial' }],
            examiner_comment: 'Well written essay with cogent argumentation.',
          });
        }
        // General evaluator
        return JSON.stringify({
          score: 8.5,
          summary: 'Great technical understanding and clear communication.',
          strengths: ['Identified event loop phases correctly'],
          improvements: ['Mention worker threads for CPU intensive tasks'],
          optimal_answer: 'The Node.js event loop runs on libuv...',
          follow_up_trap: 'What happens if you run crypto.pbkdf2Sync inside event loop?',
        });
      },
    };

    service = new LearningService(mockLearningRepo, mockAiService, mockConfigRepo);
  });

  it('records item-level quiz attempts as append-only history', async () => {
    mockLearningRepo.insertQuizResult = jest.fn().mockResolvedValue(1);
    mockLearningRepo.recordItemAttempts = jest.fn().mockResolvedValue(2);

    const result = await service.recordQuizScore('admin', 1, 2, {
      mode: 'multiple_choice',
      attempts: [
        { item_id: 1, is_correct: false },
        { item_id: 2, is_correct: true },
      ],
    }, 'user-7');

    expect(mockLearningRepo.recordItemAttempts).toHaveBeenCalledWith(
      'user-7',
      'admin',
      'vocabulary',
      expect.any(Array)
    );
    expect(result.attemptsRecorded).toBe(2);
  });

  it('builds a 50-question quiz from the vocabulary topic bank', async () => {
    mockLearningRepo.findItems = jest.fn().mockResolvedValue(
      Array.from({ length: 60 }, (_, index) => ({
        id: index + 1,
        type: 'vocabulary',
        title: `Word ${index + 1}`,
        level: index % 2 ? 'intermediate' : 'beginner',
        content: { meaning: `Meaning ${index + 1}` },
      }))
    );

    const result = await service.generateQuizSession({ count: 50, topicNo: 21, level: 'intermediate' });

    expect(result.total).toBe(50);
    expect(result.topicNo).toBe(21);
    expect(mockLearningRepo.findItems).toHaveBeenCalledWith({
      type: 'vocabulary',
      topicNo: 21,
      level: 'intermediate',
      limit: 1000,
    });
  });

  it('generateAIContent generates Tech questions in structured JSON', async () => {
    const res = await service.generateAIContent({
      categorySlug: 'tech',
      type: 'tech_question',
      learningSlug: 'nodejs',
      level: 'intermediate',
      count: 1,
    });

    assert.strictEqual(res.type, 'tech_question');
    assert.strictEqual(res.items.length, 1);
    assert.strictEqual(res.items[0].title, 'Event Loop & Phase Hierarchy');
    assert.strictEqual(res.items[0].content.quick_answer, 'process.nextTick has higher priority than Promise.then()');
  });

  it('generateAIContent generates Vocabulary batch with IPA & collocations', async () => {
    const res = await service.generateAIContent({
      categorySlug: 'english',
      type: 'vocabulary',
      learningSlug: 'topic-1',
      count: 1,
    });

    assert.strictEqual(res.type, 'vocabulary');
    assert.strictEqual(res.items.length, 1);
    assert.strictEqual(res.items[0].title, 'Meticulous');
    assert.strictEqual(res.items[0].content.pronunciation, '/məˈtɪk.jə.ləs/');
  });

  it('saveAIBatch saves Reading & Writing batch into database', async () => {
    const created = [];
    mockLearningRepo.createItem = async (data) => {
      created.push(data);
      return created.length;
    };

    const result = await service.saveAIBatch({
      learningId: 10,
      type: 'reading',
      items: [
        {
          title: 'AI in Healthcare',
          prompt: 'A passage about artificial intelligence...',
          level: 'intermediate',
          content: {
            guiding_questions: ['What are the benefits of AI?'],
            key_vocabulary: ['Breakthrough', 'Diagnostics'],
          },
          sample_solution: { model_answer: 'Model summary answer' },
        },
      ],
    });

    assert.strictEqual(result.count, 1);
    assert.strictEqual(created[0].type, 'reading');
    assert.strictEqual(created[0].title, 'AI in Healthcare');
    assert.deepStrictEqual(created[0].content.key_vocabulary, ['Breakthrough', 'Diagnostics']);
  });

  it('saveAIBatch unpacks legacy Generated Content wrappers before persisting', async () => {
    const created = [];
    mockLearningRepo.createItem = async (data) => {
      created.push(data);
      return created.length;
    };

    const result = await service.saveAIBatch({
      learningId: 10,
      type: 'tech_question',
      items: [{
        title: 'Generated Content',
        prompt: JSON.stringify([
          { title: 'Question A', prompt: 'Explain A', content: { quick_answer: 'Answer A' } },
          { title: 'Question B', prompt: 'Explain B', content: { quick_answer: 'Answer B' } },
        ]),
      }],
    });

    assert.strictEqual(result.count, 2);
    assert.deepStrictEqual(created.map((item) => item.title), ['Question A', 'Question B']);
    assert.strictEqual(created[0].content.quick_answer, 'Answer A');
  });

  it('evaluateAISubmission evaluates Tech Mock Interview answers', async () => {
    const res = await service.evaluateAISubmission({
      itemId: 10,
      username: 'admin',
      type: 'tech_question',
      userSubmission: 'Node.js event loop uses Libuv to handle asynchronous non-blocking I/O operations.',
    });

    assert.strictEqual(res.score, 8.5);
    assert.strictEqual(res.feedback.strengths[0], 'Identified event loop phases correctly');
    assert.ok(res.feedback.follow_up_trap);
  });

  it('evaluateAISubmission evaluates IELTS Writing with 4 criteria & Band score', async () => {
    const res = await service.evaluateAISubmission({
      itemId: 99,
      username: 'admin',
      type: 'ielts',
      userSubmission: 'Some people believe that university education should be free for all students.',
    });

    assert.strictEqual(res.score, 7.5);
    assert.strictEqual(res.feedback.criteria_scores.lexical_resource, 8.0);
    assert.strictEqual(res.feedback.criteria_scores.task_achievement, 7.5);
  });

  it('getConfig correctly reflects selective notification toggles (vocab enabled by default)', () => {
    const cfg = service.getConfig();
    assert.strictEqual(cfg.notify_vocab_enabled, true);
    assert.strictEqual(cfg.notify_tech_enabled, false);
    assert.strictEqual(cfg.notify_quiz_enabled, false);
    assert.strictEqual(cfg.notify_ielts_enabled, false);
    assert.strictEqual(cfg.words_per_day, 5);
  });

  it('updateConfig updates notification preferences', async () => {
    await service.updateConfig({ notify_tech_enabled: 'true', vocab_words_per_day: '10' });
    const cfg = service.getConfig();
    assert.strictEqual(cfg.notify_tech_enabled, true);
    assert.strictEqual(cfg.words_per_day, 10);
  });

  it('exportToExcel generates valid Excel buffer', async () => {
    const buf = await service.exportToExcel('topic-1');
    assert.ok(Buffer.isBuffer(buf));
    assert.ok(buf.length > 100);
  });
});
