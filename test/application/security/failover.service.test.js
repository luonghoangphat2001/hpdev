'use strict';

const ProviderFailoverPolicy = require('@policy/permissions/provider-failover.policy');

describe('T094: Provider Failover and Degraded Mode Service', () => {
  test('falls back to secondary provider when primary fails', async () => {
    const multiProviderAdapter = {
      generateResponse: jest.fn()
        .mockRejectedValueOnce(new Error('Google timeout'))
        .mockResolvedValueOnce({ content: 'Fallback response' }),
    };

    const service = new ProviderFailoverPolicy({ multiProviderAdapter, primaryProvider: 'google', fallbackProvider: 'openai' });
    const res = await service.executeWithFailover('test prompt');

    expect(res.failoverUsed).toBe(true);
    expect(res.content).toBe('Fallback response');
  });
});
