'use strict';

const SsotClient = require('../../../src/services/notification/adapter/ssot.client');
const { SsotClientError } = require('../../../src/services/notification/adapter/ssot.client');

describe('SsotClient', () => {
  const config = {
    baseUrl: 'https://ecommerce.example/',
    agentCode: 'openclaw',
    agentToken: 'super-secret-token',
  };

  it('authenticates with scoped bearer token and agent code', async () => {
    const httpClient = {
      request: jest.fn().mockResolvedValue({ data: { data: { id: 1 } } }),
    };
    const client = new SsotClient({ httpClient, config });

    await expect(client.request({
      method: 'GET',
      path: '/api/v1/storefront/agents/orders/1',
      timeoutMs: 5000,
    })).resolves.toEqual({ data: { id: 1 } });
    expect(httpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      url: 'https://ecommerce.example/api/v1/storefront/agents/orders/1',
      timeout: 5000,
      headers: expect.objectContaining({
        Authorization: 'Bearer super-secret-token',
        'X-Agent-Code': 'openclaw',
      }),
    }));
  });

  it('adds idempotency key only when supplied', async () => {
    const httpClient = {
      request: jest.fn().mockResolvedValue({ data: {} }),
    };
    const client = new SsotClient({ httpClient, config });
    await client.request({
      method: 'POST',
      path: '/action',
      data: {},
      idempotencyKey: 'idem:v1:test:key',
    });

    expect(httpClient.request.mock.calls[0][0].headers['Idempotency-Key'])
      .toBe('idem:v1:test:key');
  });

  it('checks the authenticated company Dashboard agent endpoint', async () => {
    const httpClient = {
      request: jest.fn().mockResolvedValue({
        data: { ok: true, integration: { status: 'UP' } },
      }),
    };
    const client = new SsotClient({ httpClient, config });

    await expect(client.ping()).resolves.toMatchObject({
      integration: { status: 'UP' },
    });
    expect(httpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      url: 'https://ecommerce.example/api/v1/storefront/agents/health',
      timeout: 5000,
    }));
  });

  it('sends expected resource version as an If-Match precondition', async () => {
    const httpClient = {
      request: jest.fn().mockResolvedValue({ data: {} }),
    };
    const client = new SsotClient({ httpClient, config });
    await client.request({
      method: 'POST',
      path: '/action',
      data: {},
      idempotencyKey: 'idem:v1:test:key',
      expectedResourceVersion: 'version-7',
    });

    expect(httpClient.request.mock.calls[0][0].headers['If-Match'])
      .toBe('version-7');
  });

  it('fails startup when service-account configuration is incomplete', () => {
    expect(() => new SsotClient({
      httpClient: {},
      config: { baseUrl: '', agentCode: '', agentToken: '' },
    })).toThrow('SSOT client configuration missing');
  });

  it('maps upstream errors without leaking token or raw request config', async () => {
    const httpClient = {
      request: jest.fn().mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
        config: {
          headers: { Authorization: 'Bearer super-secret-token' },
        },
      }),
    };
    const client = new SsotClient({ httpClient, config });

    try {
      await client.request({ method: 'GET', path: '/protected' });
      throw new Error('Expected request failure');
    } catch (error) {
      expect(error).toBeInstanceOf(SsotClientError);
      expect(error).toMatchObject({
        statusCode: 403,
        code: 'ssot_permission_denied',
      });
      expect(JSON.stringify(error)).not.toContain('super-secret-token');
      expect(error).not.toHaveProperty('config');
    }
  });
});
