'use strict';

const TechService = require('../../src/services/learning/TechService');

describe('TechService', () => {
  let techRepo;
  let aiService;
  let configRepo;
  let service;

  beforeEach(() => {
    techRepo = {
      findStackBySlug: jest.fn(),
      findQuestions: jest.fn(),
      findQuestionById: jest.fn(),
      findOrCreateTopic: jest.fn(),
      findExistingTitlesByStack: jest.fn(),
      createQuestion: jest.fn(),
      upsertQuestion: jest.fn(),
    };
    aiService = {
      chatOnce: jest.fn(),
    };
    configRepo = {
      get: jest.fn(),
    };
    service = new TechService(techRepo, aiService, configRepo);
  });

  test('generateQuestionWithAI parses AI response correctly', async () => {
    techRepo.findStackBySlug.mockResolvedValueOnce({ id: 1, slug: 'php', name: 'PHP' });

    const mockAiResponse = `
    \`\`\`json
    {
      "title": "Traits trong PHP 8",
      "question": "Traits hoạt động như thế nào?",
      "quick_answer": "Horizontal code reuse",
      "detailed_answer": "Traits giải quyết vấn đề đơn kế thừa...",
      "code_example": "trait Loggable { ... }",
      "interview_tips": "Bẫy: xung đột method giữa 2 traits",
      "practical_tips": "Dùng insteadof và as để đổi tên",
      "level": "mid",
      "tags": "PHP, Traits, OOP",
      "topic_name": "OOP Core"
    }
    \`\`\`
    `;
    aiService.chatOnce.mockResolvedValueOnce(mockAiResponse);

    const result = await service.generateQuestionWithAI({
      stackSlug: 'php',
      level: 'mid',
      topicName: 'OOP Core',
    });

    expect(result.title).toBe('Traits trong PHP 8');
    expect(result.quickAnswer).toBe('Horizontal code reuse');
    expect(result.stackId).toBe(1);
    expect(aiService.chatOnce).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('công nghệ PHP'),
        }),
      ]),
      null
    );
  });

  test('batchGenerateWithAI requests multiple questions and parses array', async () => {
    techRepo.findStackBySlug.mockResolvedValueOnce({ id: 2, slug: 'nextjs', name: 'Next.js' });
    techRepo.findExistingTitlesByStack.mockResolvedValueOnce([
      { id: 10, title: 'Server Actions' }
    ]);

    const mockAiArray = JSON.stringify([
      {
        title: 'Streaming SSR with Suspense',
        question: 'How does Streaming SSR work?',
        quick_answer: 'Streams HTML chunks',
        detailed_answer: 'Detailed streaming explanation',
        code_example: '<Suspense fallback={<Loading />}>',
        interview_tips: 'Improves TTFB',
        practical_tips: 'Wrap slow components',
        level: 'senior',
        tags: 'Next.js, SSR, Suspense',
        topic_name: 'Rendering'
      }
    ]);

    aiService.chatOnce.mockResolvedValueOnce(mockAiArray);

    const results = await service.batchGenerateWithAI({
      stackSlug: 'nextjs',
      level: 'senior',
      count: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Streaming SSR with Suspense');
    expect(results[0].stackId).toBe(2);
  });

  test('evaluateMockInterview returns score and feedback', async () => {
    techRepo.findQuestionById.mockResolvedValueOnce({
      id: 5,
      stack_name: 'JavaScript',
      title: 'Event Loop',
      question: 'Giải thích Event Loop?',
      quick_answer: 'Call stack, Microtask, Macrotask',
      detailed_answer: 'Detailed event loop mechanism',
    });

    const mockEvalResponse = JSON.stringify({
      score: 9,
      rating: 'Xuất sắc',
      strengths: 'Hiểu rõ Microtask vs Macrotask',
      improvements: 'Cần bổ sung ví dụ queueMicrotask',
      ideal_pitch: 'Tóm tắt chuẩn trong 30s...',
      follow_up_question: 'Nếu đệ quy microtask thì điều gì xảy ra?'
    });

    aiService.chatOnce.mockResolvedValueOnce(mockEvalResponse);

    const evalResult = await service.evaluateMockInterview({
      questionId: 5,
      userAnswer: 'JavaScript đơn luồng, xử lý microtask trước rồi mới tới macrotask.',
    });

    expect(evalResult.score).toBe(9);
    expect(evalResult.rating).toBe('Xuất sắc');
    expect(evalResult.follow_up_question).toBe('Nếu đệ quy microtask thì điều gì xảy ra?');
  });
});
