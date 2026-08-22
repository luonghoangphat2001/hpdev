'use strict';

const assert = require('assert');
const LearningController = require('../../src/controllers/LearningController');

describe('LearningController', () => {
  let controller;
  let mockLearningRepo;
  let mockLearningService;

  beforeEach(() => {
    mockLearningRepo = {
      findCategories: async () => [{ id: 1, slug: 'tech', name: 'Tech' }],
      findLearnings: async () => [{ id: 10, slug: 'php', name: 'PHP' }],
      findLearningBySlug: async (slug) => slug === 'php' ? { id: 10, slug: 'php', name: 'PHP' } : null,
      findItems: async () => [{ id: 1, title: 'Item 1' }],
      findItemById: async (id) => id === 1 ? { id: 1, title: 'Item 1' } : null,
      findPracticeExamPool: async () => [
        { id: 1, learning_slug: 'php', level: 'junior' },
        { id: 2, learning_slug: 'nodejs', level: 'senior' },
      ],
      getItemPerformance: async () => [],
      createItem: async () => 101,
      updateItem: async () => true,
      deleteItem: async () => true,
      upsertMetadata: async () => true,
    };

    mockLearningService = {
      generateAIContent: async () => ({ type: 'vocabulary', items: [{ title: 'Serendipity' }] }),
      saveAIBatch: async () => ({ count: 1, ids: [101] }),
      evaluateAISubmission: async () => ({ score: 9.0, feedback: { summary: 'Great' } }),
      buildQuizFromVocab: async () => ({ total: 1, questions: [{ id: 1 }] }),
      recordQuizScore: async () => ({ ok: true, score: 1, total: 1 }),
      recordPracticeExamAttempts: async (_userId, _username, attempts) => attempts.length,
      getConfig: () => ({ notify_vocab_enabled: true }),
      updateConfig: async () => {},
      sendSingleItemToDiscord: async () => ({ ok: true, message: 'Sent' }),
      exportToExcel: async () => Buffer.from('excel-data'),
    };

    controller = new LearningController(mockLearningRepo, mockLearningService);
  });

  function mockRes() {
    return {
      statusCode: 200,
      jsonData: null,
      status(c) { this.statusCode = c; return this; },
      json(d) { this.jsonData = d; return this; },
      setHeader() {},
      send(d) { this.sentData = d; return this; },
    };
  }

  it('categories returns 200 with list', async () => {
    const res = mockRes();
    await controller.categories({}, res);
    assert.strictEqual(res.jsonData.ok, true);
    assert.strictEqual(res.jsonData.categories.length, 1);
  });

  it('learnings returns 200 with list', async () => {
    const res = mockRes();
    await controller.learnings({ query: { category: 'tech' } }, res);
    assert.strictEqual(res.jsonData.ok, true);
    assert.strictEqual(res.jsonData.learnings.length, 1);
  });

  it('items returns filtered list', async () => {
    const res = mockRes();
    await controller.items({ query: { category: 'tech' }, session: { username: 'admin' } }, res);
    assert.strictEqual(res.jsonData.ok, true);
    assert.strictEqual(res.jsonData.items.length, 1);
  });

  it('createItem creates and returns id', async () => {
    const res = mockRes();
    await controller.createItem({
      body: { learning_id: 10, title: 'New Question' },
      session: { username: 'admin' },
    }, res);
    assert.strictEqual(res.jsonData.ok, true);
    assert.strictEqual(res.jsonData.id, 101);
  });

  it('generateAI calls AI generator service', async () => {
    const res = mockRes();
    await controller.generateAI({
      body: { category: 'english', type: 'vocabulary', learning: 'topic-1' },
    }, res);
    assert.strictEqual(res.jsonData.ok, true);
    assert.strictEqual(res.jsonData.items[0].title, 'Serendipity');
  });

  it('evaluateAI evaluates user submission', async () => {
    const res = mockRes();
    await controller.evaluateAI({
      body: { item_id: 1, type: 'tech_question', user_submission: 'Answer here' },
      session: { username: 'admin' },
    }, res);
    assert.strictEqual(res.jsonData.ok, true);
    assert.strictEqual(res.jsonData.score, 9.0);
  });

  it('buildQuiz uses the Learning service quiz method', async () => {
    let receivedOptions;
    mockLearningService.buildQuizFromVocab = async (options) => {
      receivedOptions = options;
      return { total: 1, questions: [{ id: 1 }] };
    };
    const res = mockRes();
    await controller.buildQuiz({
      query: { count: '5', topic_no: '21', level: 'intermediate' },
      session: { userId: 7 },
    }, res);
    assert.strictEqual(res.jsonData.ok, true);
    assert.strictEqual(res.jsonData.questions.length, 1);
    assert.deepStrictEqual(receivedOptions, {
      topicNo: 21,
      count: 5,
      mode: 'multiple_choice',
      level: 'intermediate',
      userId: '7',
    });
  });

  it('buildPracticeExam returns theory questions with normalized levels', async () => {
    const res = mockRes();
    await controller.buildPracticeExam({
      query: { count: '20', learnings: 'php,nodejs', types: 'tech_question' },
    }, res);
    assert.strictEqual(res.jsonData.ok, true);
    assert.strictEqual(res.jsonData.total, 2);
    assert.deepStrictEqual(res.jsonData.levels, { hard: 1, medium: 0, easy: 1 });
  });

  it('buildPracticeExam defaults to and caps the API response at 50 questions', async () => {
    const levels = ['senior', 'intermediate', 'beginner'];
    mockLearningRepo.findPracticeExamPool = async () => Array.from({ length: 90 }, (_, index) => ({
      id: index + 1,
      learning_slug: `stack-${(index % 8) + 1}`,
      level: levels[index % levels.length],
    }));

    const defaultRes = mockRes();
    await controller.buildPracticeExam({ query: {}, session: { username: 'admin' } }, defaultRes);
    assert.strictEqual(defaultRes.jsonData.total, 50);
    assert.deepStrictEqual(defaultRes.jsonData.levels, { hard: 17, medium: 17, easy: 16 });

    const cappedRes = mockRes();
    await controller.buildPracticeExam({ query: { count: '100' }, session: { username: 'admin' } }, cappedRes);
    assert.strictEqual(cappedRes.jsonData.total, 50);
  });

  it('submitPracticeExam persists every answered theory item', async () => {
    const res = mockRes();
    await controller.submitPracticeExam({
      session: { userId: 7, username: 'admin' },
      body: { attempts: [{ item_id: 1, is_correct: false }, { item_id: 2, is_correct: true }] },
    }, res);
    assert.strictEqual(res.jsonData.ok, true);
    assert.strictEqual(res.jsonData.recorded, 2);
  });

  it('getConfig & updateConfig manage notifications', async () => {
    const res1 = mockRes();
    controller.getConfig({}, res1);
    assert.strictEqual(res1.jsonData.config.notify_vocab_enabled, true);

    const res2 = mockRes();
    await controller.updateConfig({ body: { notify_tech_enabled: true } }, res2);
    assert.strictEqual(res2.jsonData.ok, true);
  });
});
