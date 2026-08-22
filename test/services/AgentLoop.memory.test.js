'use strict';

const AgentLoop = require('../../src/services/ai/AgentLoop');

describe('AgentLoop — memory tools', () => {
  let mockProvider, mockOpenClaw, mockInsightRepo;

  beforeEach(() => {
    mockProvider    = { chatWithTools: jest.fn(), chat: jest.fn() };
    mockOpenClaw    = { search: jest.fn(), crawl: jest.fn(), fetch: jest.fn(), automate: jest.fn() };
    mockInsightRepo = { upsert: jest.fn().mockResolvedValue(), findByUser: jest.fn() };
  });

  const ctx = { userId: 'u1', platform: 'discord', channelId: 'ch1' };

  it('dispatches save_memory to InsightRepository.upsert', async () => {
    const loop = new AgentLoop(mockProvider, mockOpenClaw, mockInsightRepo);
    mockProvider.chatWithTools
      .mockResolvedValueOnce({ type: 'tool_calls', toolCalls: [{ id: 't1', name: 'save_memory', args: { key: 'interest', value: 'React Native' } }], tokensIn: 10, tokensOut: 5 })
      .mockResolvedValueOnce({ type: 'text', text: 'Đã lưu!', tokensIn: 5, tokensOut: 3 });

    await loop.run([{ role: 'user', content: 'Tao đang học React Native' }], 'sys', ctx);

    expect(mockInsightRepo.upsert).toHaveBeenCalledWith('u1', 'discord', 'ch1', 'interest', 'React Native', undefined);
  });

  it('dispatches recall_memory to InsightRepository.findByUser', async () => {
    const loop = new AgentLoop(mockProvider, mockOpenClaw, mockInsightRepo);
    mockInsightRepo.findByUser.mockResolvedValue([{ mem_key: 'interest', mem_value: 'React Native' }]);
    mockProvider.chatWithTools
      .mockResolvedValueOnce({ type: 'tool_calls', toolCalls: [{ id: 't2', name: 'recall_memory', args: {} }], tokensIn: 10, tokensOut: 5 })
      .mockResolvedValueOnce({ type: 'text', text: 'Mày đang học React Native', tokensIn: 5, tokensOut: 3 });

    await loop.run([{ role: 'user', content: 'Tao đang làm gì?' }], 'sys', ctx);

    expect(mockInsightRepo.findByUser).toHaveBeenCalledWith('u1', 'discord');
  });
});
