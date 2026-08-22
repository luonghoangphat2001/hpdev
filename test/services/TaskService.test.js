'use strict';

const mockAgentChat = jest.fn();
const mockCreate    = jest.fn().mockResolvedValue(42);
const mockUpdate    = jest.fn().mockResolvedValue();

jest.mock('../../src/models/TaskRepository', () =>
  jest.fn().mockImplementation(() => ({ create: mockCreate, updateStatus: mockUpdate }))
);
jest.mock('../../src/models/Database', () => ({
  getInstance: jest.fn().mockResolvedValue({}),
}));

const TaskService = require('../../src/services/scheduler/TaskService');

describe('TaskService', () => {
  let mockAIService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAIService = { agentChat: mockAgentChat };
    mockCreate.mockResolvedValue(42);
    mockUpdate.mockResolvedValue();
  });

  it('createAndRun() creates task, runs agentChat, updates to done', async () => {
    mockAgentChat.mockResolvedValue('Kết quả nghiên cứu');
    const onComplete = jest.fn();

    const taskId = await new TaskService().createAndRun({
      aiService:      mockAIService,
      userId:         'u1',
      username:       'tester',
      platform:       'discord',
      channelId:      'ch1',
      description:    'Research 50 bài',
      prompt:         'Tìm 50 bài về AI',
      openClawService: {},
      onComplete,
    });

    expect(taskId).toBe(42);
    expect(mockCreate).toHaveBeenCalled();
    // First updateStatus: 'running'
    expect(mockUpdate).toHaveBeenNthCalledWith(1, 42, 'running');

    // Let background async settle
    await new Promise((r) => setTimeout(r, 20));
    expect(mockAgentChat).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'Tìm 50 bài về AI', userId: 'u1', platform: 'discord' })
    );
    // Second updateStatus: 'done'
    expect(mockUpdate).toHaveBeenNthCalledWith(2, 42, 'done', 'Kết quả nghiên cứu');
    expect(onComplete).toHaveBeenCalledWith('Kết quả nghiên cứu', null);
  });

  it('updates to failed when agentChat throws', async () => {
    mockAgentChat.mockRejectedValue(new Error('rate limit'));
    const onComplete = jest.fn();

    await new TaskService().createAndRun({
      aiService:      mockAIService,
      userId:         'u1',
      username:       'tester',
      platform:       'discord',
      channelId:      'ch1',
      description:    'Research',
      prompt:         'test',
      openClawService: {},
      onComplete,
    });

    await new Promise((r) => setTimeout(r, 20));
    // Second call should be 'failed'
    expect(mockUpdate).toHaveBeenNthCalledWith(2, 42, 'failed', 'rate limit');
    expect(onComplete).toHaveBeenCalledWith(null, expect.any(Error));
  });
});
