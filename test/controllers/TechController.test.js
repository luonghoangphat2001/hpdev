'use strict';

const TechController = require('../../src/controllers/TechController');

describe('TechController', () => {
  let techRepo;
  let techService;
  let controller;
  let req;
  let res;

  beforeEach(() => {
    techRepo = {
      findStacks: jest.fn(),
      findTopics: jest.fn(),
      findQuestions: jest.fn(),
      countQuestions: jest.fn(),
      findQuestionById: jest.fn(),
      createQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      deleteQuestion: jest.fn(),
      upsertUserProgress: jest.fn(),
    };
    techService = {
      generateQuestionWithAI: jest.fn(),
      batchGenerateWithAI: jest.fn(),
      evaluateMockInterview: jest.fn(),
      importQuestionsFromExcel: jest.fn(),
      exportQuestionsToExcel: jest.fn(),
    };
    controller = new TechController(techRepo, techService);
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
  });

  test('getStacks returns stacks array', async () => {
    req = { session: { userId: 12 } };
    techRepo.findStacks.mockResolvedValueOnce([{ id: 1, slug: 'php' }]);

    await controller.getStacks(req, res);

    expect(techRepo.findStacks).toHaveBeenCalledWith(12);
    expect(res.json).toHaveBeenCalledWith({ ok: true, stacks: [{ id: 1, slug: 'php' }] });
  });

  test('getQuestions handles query filters and returns list with total', async () => {
    req = {
      session: { userId: 12 },
      query: { stack: 'reactjs', level: 'mid', limit: '20', offset: '0' },
    };
    techRepo.findQuestions.mockResolvedValueOnce([{ id: 1, title: 'Virtual DOM' }]);
    techRepo.countQuestions.mockResolvedValueOnce(1);

    await controller.getQuestions(req, res);

    expect(techRepo.findQuestions).toHaveBeenCalledWith(
      expect.objectContaining({
        stackSlug: 'reactjs',
        level: 'mid',
        limit: 20,
        offset: 0,
        userId: 12,
      })
    );
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      questions: [{ id: 1, title: 'Virtual DOM' }],
      total: 1,
      limit: 20,
      offset: 0,
    });
  });

  test('updateProgress returns 401 when not logged in', async () => {
    req = { session: {}, params: { id: 5 }, body: { status: 'mastered' } };

    await controller.updateProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Unauthorized' });
  });

  test('updateProgress calls repository when authorized', async () => {
    req = { session: { userId: 10 }, params: { id: 5 }, body: { status: 'mastered' } };
    techRepo.upsertUserProgress.mockResolvedValueOnce(true);

    await controller.updateProgress(req, res);

    expect(techRepo.upsertUserProgress).toHaveBeenCalledWith(10, 5, {
      status: 'mastered',
      isBookmarked: undefined,
      personalNotes: undefined,
    });
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  test('generateAIQuestion delegates to techService', async () => {
    req = {
      body: { stackSlug: 'python', level: 'senior', topicName: 'GIL' },
    };
    techService.generateQuestionWithAI.mockResolvedValueOnce({
      title: 'Python GIL',
      level: 'senior',
    });

    await controller.generateAIQuestion(req, res);

    expect(techService.generateQuestionWithAI).toHaveBeenCalledWith({
      stackSlug: 'python',
      level: 'senior',
      topicName: 'GIL',
      customPrompt: undefined,
      model: undefined,
    });
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      question: { title: 'Python GIL', level: 'senior' },
    });
  });
});
