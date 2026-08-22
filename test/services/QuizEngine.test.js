'use strict';

const QuizEngine = require('../../src/services/learning/QuizEngine');

describe('QuizEngine', () => {
  let mockVocabRepo;
  let mockQuizRepo;
  let quizEngine;

  beforeEach(() => {
    mockVocabRepo = {
      findWords: jest.fn().mockResolvedValue([
        { id: 1, topic_no: 1, word: 'apple', meaning: 'quả táo', pronunciation: 'ˈæp.əl', example: 'I like apple.' },
        { id: 2, topic_no: 1, word: 'banana', meaning: 'quả chuối', pronunciation: 'bəˈnæn.ə', example: 'Yellow banana.' },
        { id: 3, topic_no: 1, word: 'orange', meaning: 'quả cam', pronunciation: 'ˈɔːr.ɪndʒ', example: 'Fresh orange.' },
        { id: 4, topic_no: 1, word: 'grape', meaning: 'quả nho', pronunciation: 'ɡreɪp', example: 'Sweet grape.' },
      ]),
    };

    mockQuizRepo = {
      getItemPerformance: jest.fn().mockResolvedValue([]),
      recordResult: jest.fn().mockResolvedValue({
        user_id: 'user1',
        username: 'TestUser',
        total_score: 10,
        correct_count: 1,
        wrong_count: 0,
        streak_days: 1,
      }),
      getLeaderboard: jest.fn().mockResolvedValue([
        { user_id: 'user1', username: 'TestUser', total_score: 10, streak_days: 1 },
      ]),
    };

    quizEngine = new QuizEngine(mockVocabRepo, mockQuizRepo);
  });

  it('should generate multiple choice questions', async () => {
    const res = await quizEngine.generateQuestions({ mode: 'multiple_choice', limit: 2 });
    expect(res.mode).toBe('multiple_choice');
    expect(res.questions.length).toBe(2);
    expect(res.questions[0].options.length).toBe(4);
  });

  it('should generate IPA matching questions', async () => {
    const res = await quizEngine.generateQuestions({ mode: 'ipa_matching', limit: 2 });
    expect(res.mode).toBe('ipa_matching');
    expect(res.questions[0].pronunciation).toBeDefined();
  });

  it('prioritizes words the current user previously answered incorrectly', async () => {
    mockQuizRepo.getItemPerformance.mockResolvedValue([
      { item_id: 1, correct_count: 20, wrong_count: 0 },
      { item_id: 2, correct_count: 0, wrong_count: 5 },
    ]);
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const res = await quizEngine.generateQuestions({
      mode: 'multiple_choice',
      limit: 1,
      userId: 'user1',
    });

    expect(mockQuizRepo.getItemPerformance).toHaveBeenCalledWith('user1', [1, 2, 3, 4]);
    expect(res.questions[0].id).toBe(2);
    randomSpy.mockRestore();
  });

  it('should evaluate correct multiple choice answer and score', async () => {
    const result = await quizEngine.submitAnswer({
      userId: 'user1',
      username: 'TestUser',
      wordId: 1,
      quizType: 'multiple_choice',
      answer: 'quả táo',
    });

    expect(result.isCorrect).toBe(true);
    expect(result.scoreDelta).toBe(10);
    expect(result.explanation.word).toBe('apple');
  });

  it('should evaluate incorrect answer correctly', async () => {
    const result = await quizEngine.submitAnswer({
      userId: 'user1',
      username: 'TestUser',
      wordId: 1,
      quizType: 'multiple_choice',
      answer: 'sai rùi',
    });

    expect(result.isCorrect).toBe(false);
    expect(result.scoreDelta).toBe(0);
  });
});
