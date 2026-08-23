'use strict';

const QuizController = require('../../src/controllers/QuizController');

describe('QuizController', () => {
  let controller;
  let mockQuizEngine;

  beforeEach(() => {
    mockQuizEngine = {
      generateQuestions: jest.fn().mockResolvedValue({
        mode: 'multiple_choice',
        total: 1,
        questions: [{ id: 1, word: 'apple' }],
      }),
      submitAnswer: jest.fn().mockResolvedValue({
        wordId: 1,
        isCorrect: true,
        isLearned: true,
        status: 'mastered',
        scoreDelta: 10,
      }),
      getLeaderboard: jest.fn().mockResolvedValue([
        { user_id: 'user1', username: 'Tester', total_score: 100 },
      ]),
      getUserHistory: jest.fn().mockResolvedValue({
        history: [{ id: 1, word: 'apple', is_correct: true }],
        total: 1,
      }),
    };

    controller = new QuizController(mockQuizEngine);
  });

  function mockRes() {
    return {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
  }

  it('generate returns questions', async () => {
    const res = mockRes();
    await controller.generate({
      query: { mode: 'multiple_choice', topic: '1', limit: '5' },
      session: { userId: 'u1' },
    }, res);

    expect(res.jsonData.ok).toBe(true);
    expect(res.jsonData.total).toBe(1);
    expect(mockQuizEngine.generateQuestions).toHaveBeenCalledWith({
      mode: 'multiple_choice',
      topicNo: '1',
      limit: '5',
      userId: 'u1',
    });
  });

  it('submit returns answer outcome and learned status', async () => {
    const res = mockRes();
    await controller.submit({
      session: { userId: 'u1', username: 'Tester' },
      body: { word_id: 1, quiz_type: 'multiple_choice', answer: 'quả táo' },
    }, res);

    expect(res.jsonData.ok).toBe(true);
    expect(res.jsonData.isCorrect).toBe(true);
    expect(res.jsonData.isLearned).toBe(true);
    expect(res.jsonData.status).toBe('mastered');
  });

  it('leaderboard returns top rankings', async () => {
    const res = mockRes();
    await controller.leaderboard({ query: { limit: '10' } }, res);

    expect(res.jsonData.ok).toBe(true);
    expect(res.jsonData.rankings.length).toBe(1);
  });

  it('history returns user quiz history', async () => {
    const res = mockRes();
    await controller.history({
      session: { userId: 'u1' },
      query: { limit: '10', offset: '0' },
    }, res);

    expect(res.jsonData.ok).toBe(true);
    expect(res.jsonData.history.length).toBe(1);
    expect(mockQuizEngine.getUserHistory).toHaveBeenCalledWith('u1', { limit: 10, offset: 0 });
  });
});
