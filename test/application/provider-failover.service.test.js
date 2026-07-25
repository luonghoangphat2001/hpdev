'use strict';

const ProviderFailoverService = require('../../src/application/services/provider-failover.service');

describe('T094: Provider Failover and Degraded Mode Service', () => {
  test('falls back to secondary provider when primary fails', async () => {
    const multiProviderAdapter = {
      generateResponse: jest.fn()
        .mockRejectedValueOnce(new Error('Google timeout'))
        .mockResolvedValueOnce({ content: 'Fallback response' }),
    };

    const service = new ProviderFailoverService({ multiProviderAdapter, primaryProvider: 'google', fallbackProvider: 'openai' });
    const res = await service.executeWithFailover('test prompt');

    expect(res.failoverUsed).toBe(true);
    expect(res.content).toBe('Fallback response');
  });
});
