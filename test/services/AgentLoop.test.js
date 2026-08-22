'use strict';

const AgentLoop = require('../../src/services/ai/AgentLoop');

function makeProvider(responses) {
  let callCount = 0;
  let chatCount = 0;
  return {
    chatWithTools: jest.fn(async (_messages, _systemPrompt, options = {}) => {
      if (callCount >= 2 && Array.isArray(options.allowedToolNames) && options.allowedToolNames.length === 0) {
        return { type: 'text', text: 'fallback final answer', tokensIn: 1, tokensOut: 1 };
      }
      return responses[callCount++] ?? responses[responses.length - 1];
    }),
    chat:          jest.fn(async () => chatCount++ === 0
      ? { text: '{"capability":"none"}', tokensIn: 1, tokensOut: 1 }
      : { text: 'fallback final answer', tokensIn: 1, tokensOut: 1 }),
  };
}

function makeOpenClaw() {
  return {
    search:   jest.fn(async () => ({ results: [{ title: 'Result', snippet: 'Content', link: 'https://example.com' }] })),
    crawl:    jest.fn(async () => ({ title: 'Page', text: 'Page content', url: 'https://example.com' })),
    fetch:    jest.fn(async () => ({ status: 200, data: '{}' })),
    automate: jest.fn(async () => ({ success: true, screenshot: null })),
  };
}

const MESSAGES     = [{ role: 'user', content: 'Hello' }];
const SYSTEM_PROMPT = 'Be helpful';

describe('AgentLoop.run()', () => {
  test('returns text immediately when provider gives text response', async () => {
    const provider  = makeProvider([{ type: 'text', text: 'Direct answer', tokensIn: 10, tokensOut: 5 }]);
    const openClaw  = makeOpenClaw();
    const loop      = new AgentLoop(provider, openClaw);

    const result = await loop.run(MESSAGES, SYSTEM_PROMPT);

    expect(result.text).toBe('Direct answer');
    expect(result.tokensIn).toBe(10);
    expect(result.tokensOut).toBe(5);
    expect(provider.chatWithTools).toHaveBeenCalledTimes(1);
    expect(openClaw.search).not.toHaveBeenCalled();
  });

  test('executes web_search tool then returns text on second round', async () => {
    const provider = makeProvider([
      {
        type: 'tool_calls',
        text: null,
        toolCalls: [{ id: 'call_1', name: 'web_search', args: { query: 'test query' } }],
        tokensIn: 20, tokensOut: 8,
      },
      { type: 'text', text: 'Search summary', tokensIn: 30, tokensOut: 10 },
    ]);
    const openClaw = makeOpenClaw();
    const loop = new AgentLoop(provider, openClaw);

    const result = await loop.run(MESSAGES, SYSTEM_PROMPT);

    expect(openClaw.search).toHaveBeenCalledWith('test query', undefined);
    expect(provider.chatWithTools).toHaveBeenCalledTimes(2);
    expect(result.text).toBe('Search summary');
    expect(result.tokensIn).toBe(50);   // 20 + 30
    expect(result.tokensOut).toBe(18);  // 8 + 10
  });

  test('executes web_crawl tool', async () => {
    const provider = makeProvider([
      {
        type: 'tool_calls', text: null,
        toolCalls: [{ id: 'call_2', name: 'web_crawl', args: { url: 'https://example.com' } }],
        tokensIn: 5, tokensOut: 3,
      },
      { type: 'text', text: 'Crawl summary', tokensIn: 10, tokensOut: 5 },
    ]);
    const openClaw = makeOpenClaw();
    const loop = new AgentLoop(provider, openClaw);

    await loop.run(MESSAGES, SYSTEM_PROMPT);

    expect(openClaw.crawl).toHaveBeenCalledWith('https://example.com', undefined);
  });

  test('delegates natural-language schedule intent to the structured scheduler boundary', async () => {
    const provider = makeProvider([
      {
        type: 'tool_calls', text: null,
        toolCalls: [{
          id: 'schedule_1',
          name: 'schedule_manage',
          args: {
            operation: 'create',
            title: 'Họp đội',
            remindAt: '2026-07-26 09:00:00',
            repeatType: 'none',
          },
        }],
        tokensIn: 8, tokensOut: 4,
      },
      { type: 'text', text: 'Đã thêm lịch.', tokensIn: 8, tokensOut: 4 },
    ]);
    const scheduler = { manage: jest.fn(async (args) => ({
      operation: args.operation,
      schedule: { id: 1, title: args.title, remindAt: args.remindAt },
    })) };
    const loop = new AgentLoop(provider, makeOpenClaw(), null, scheduler);

    await loop.run(MESSAGES, SYSTEM_PROMPT, {
      userId: 'u1', username: 'alice', platform: 'discord', channelId: 'c1',
    });

    expect(scheduler.manage).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'create',
      title: 'Họp đội',
      remindAt: '2026-07-26 09:00:00',
      userId: 'u1',
      platform: 'discord',
      channelId: 'c1',
    }));
    expect(provider.chatWithTools).toHaveBeenCalledTimes(1);
  });

  test('second chatWithTools call receives tool_result messages', async () => {
    const provider = makeProvider([
      {
        type: 'tool_calls', text: null,
        toolCalls: [{ id: 'call_3', name: 'web_search', args: { query: 'q' } }],
        tokensIn: 5, tokensOut: 3,
      },
      { type: 'text', text: 'Done', tokensIn: 5, tokensOut: 3 },
    ]);
    const openClaw = makeOpenClaw();
    const loop = new AgentLoop(provider, openClaw);

    await loop.run(MESSAGES, SYSTEM_PROMPT);

    const secondCallMessages = provider.chatWithTools.mock.calls[1][0];
    expect(secondCallMessages.some(m => m.role === 'assistant_tool_call')).toBe(true);
    expect(secondCallMessages.some(m => m.role === 'tool_result')).toBe(true);
  });

  test('falls back to chat() after max iterations', async () => {
    // Always return tool_calls → triggers max iteration fallback
    const alwaysToolCall = {
      type: 'tool_calls', text: null,
      toolCalls: [{ id: 'c', name: 'web_search', args: { query: 'q' } }],
      tokensIn: 1, tokensOut: 1,
    };
    const provider = makeProvider(Array(10).fill(alwaysToolCall));
    const loop = new AgentLoop(provider, makeOpenClaw());

    const result = await loop.run(MESSAGES, SYSTEM_PROMPT);

    expect(result.text).toBe('fallback final answer');
    expect(provider.chatWithTools).toHaveBeenCalledTimes(3); // MAX_ITERATIONS + tool-safe finalisation
    expect(provider.chat).toHaveBeenCalledTimes(1); // capability route
  });

  test('throws on unknown tool name', async () => {
    const provider = makeProvider([{
      type: 'tool_calls', text: null,
      toolCalls: [{ id: 'x', name: 'unknown_tool', args: {} }],
      tokensIn: 1, tokensOut: 1,
    }]);
    const loop = new AgentLoop(provider, makeOpenClaw());

    await expect(loop.run(MESSAGES, SYSTEM_PROMPT)).rejects.toThrow('Unknown tool: unknown_tool');
  });
});
