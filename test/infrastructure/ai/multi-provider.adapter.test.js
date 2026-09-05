'use strict';

const MultiProviderAdapter = require('@services/ai/router/multi-provider.adapter');

describe('T093: Multi-Provider Abstraction Adapter', () => {
  test('delegates prompt completion to specified provider', async () => {
    const mockGoogle = { complete: jest.fn().mockResolvedValue({ content: 'Hello Google' }) };
    const mockOpenAI = { complete: jest.fn().mockResolvedValue({ content: 'Hello OpenAI' }) };

    const adapter = new MultiProviderAdapter({ google: mockGoogle, openai: mockOpenAI });
    const resGoogle = await adapter.generateResponse({ providerName: 'google', prompt: 'test' });
    const resOpenAI = await adapter.generateResponse({ providerName: 'openai', prompt: 'test' });

    expect(resGoogle.content).toBe('Hello Google');
    expect(resOpenAI.content).toBe('Hello OpenAI');
  });
});
