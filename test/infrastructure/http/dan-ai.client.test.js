'use strict';

const DanAiClient = require('../../../src/services/notification/adapter/dan-ai.client');
const {
  DanAiNotificationClientError,
} = require('../../../src/services/notification/adapter/dan-ai.client');

describe('DanAiClient', () => {
  const config = {
    baseUrl: 'https://dan-ai.example/',
    apiSecret: 'inbound-secret',
    timeoutMs: 4321,
  };

  test('uses only dan_ai API credentials and returns the queue receipt', async () => {
    const httpClient = {
      request: jest.fn().mockResolvedValue({
        data: { ok: true, notificationId: 91, duplicate: false },
      }),
    };
    const client = new DanAiClient({ httpClient, config });
    const payload = {
      idempotencyKey: 'report:cfo:2026-07-25',
      title: 'Daily report',
      message: 'All checks passed.',
      severity: 'success',
      source: 'openclaw',
    };

    await expect(client.sendNotification(payload)).resolves.toEqual({
      ok: true,
      notificationId: 91,
      duplicate: false,
    });
    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://dan-ai.example/api/integrations/openclaw/discord-notifications',
      data: payload,
      timeout: 4321,
      headers: {
        Authorization: 'Bearer inbound-secret',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  });

  test('does not leak upstream response details in errors', async () => {
    const httpClient = {
      request: jest.fn().mockRejectedValue({
        response: { status: 500, data: { message: 'database password leaked' } },
      }),
    };
    const client = new DanAiClient({ httpClient, config });

    await expect(client.sendNotification({})).rejects.toMatchObject({
      name: 'DanAiNotificationClientError',
      message: 'dan_ai notification request failed',
      statusCode: 500,
    });
    await client.sendNotification({}).catch((error) => {
      expect(error).toBeInstanceOf(DanAiNotificationClientError);
      expect(error.message).not.toContain('password');
    });
  });

  test('fails closed when the adapter API is not configured', () => {
    expect(() => new DanAiClient({
      httpClient: {},
      config: { baseUrl: '', apiSecret: '', timeoutMs: 5000 },
    })).toThrow('baseUrl, apiSecret');
  });
});
