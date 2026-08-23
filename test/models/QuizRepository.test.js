'use strict';

const QuizRepository = require('../../src/models/QuizRepository');

describe('QuizRepository adaptive history', () => {
  it('aggregates only the requested user and item ids', async () => {
    const db = { query: jest.fn().mockResolvedValue([]) };
    const repo = new QuizRepository(db);

    await repo.getItemPerformance('user-7', [4, 5, 4]);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('GROUP BY item_id'),
      ['user-7', 4, 5]
    );
  });

  it('does not query when no valid item id is supplied', async () => {
    const db = { query: jest.fn() };
    const repo = new QuizRepository(db);
    await expect(repo.getItemPerformance('user-7', [])).resolves.toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('recordResult updates stats and marks item mastered on correct answer', async () => {
    const db = {
      query: jest.fn().mockResolvedValue({ affectedRows: 1 }),
      queryOne: jest.fn()
        .mockResolvedValueOnce({ total_score: 10, correct_count: 1, streak_days: 1 }) // getUserStats
        .mockResolvedValueOnce({ total_score: 20, correct_count: 2, streak_days: 2 }) // getUserStats return
        .mockResolvedValueOnce({ learning_id: 5 }) // checkTopicCompletionByItem
        .mockResolvedValueOnce({ total: 10 }) // total active in topic
        .mockResolvedValueOnce({ mastered_count: 10 }), // mastered count in topic
    };
    const repo = new QuizRepository(db);

    await repo.recordResult({
      userId: 'user-7',
      username: 'learner',
      wordId: 101,
      quizType: 'multiple_choice',
      isCorrect: true,
      scoreDelta: 10,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO learning_quiz_result'),
      [101, 'user-7', 'learner', 'multiple_choice', 1, 10]
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('status = \'mastered\''),
      [101, 'learner']
    );
  });

  it('getUserQuizHistory returns paginated history with details', async () => {
    const db = {
      query: jest.fn().mockResolvedValue([
        { id: 1, word: 'apple', meaning: 'quả táo', is_correct: 1 }
      ]),
      queryOne: jest.fn().mockResolvedValue({ total: 1 }),
    };
    const repo = new QuizRepository(db);

    const res = await repo.getUserQuizHistory('user-7', { limit: 10, offset: 0 });
    expect(res.total).toBe(1);
    expect(res.history.length).toBe(1);
    expect(res.history[0].word).toBe('apple');
  });
});
