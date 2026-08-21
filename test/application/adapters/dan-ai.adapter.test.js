'use strict';

const DanAiAdapter = require('../../../src/services/notification/adapter/dan-ai.adapter');

describe('DanAiAdapter', () => {
  test('maps an orchestration notification to the dan_ai boundary', async () => {
    const client = {
      sendNotification: jest.fn().mockResolvedValue({ ok: true, notificationId: 12 }),
    };
    const adapter = new DanAiAdapter(client);

    await expect(adapter.notify({
      idempotencyKey: 'workflow:22:approval',
      title: 'CEO approval required',
      message: 'Refund proposal is waiting.',
      severity: 'warning',
    })).resolves.toEqual({ ok: true, notificationId: 12 });

    expect(client.sendNotification).toHaveBeenCalledWith({
      idempotencyKey: 'workflow:22:approval',
      title: 'CEO approval required',
      message: 'Refund proposal is waiting.',
      severity: 'warning',
      source: 'openclaw',
    });
  });

  test('rejects invalid input before crossing the service boundary', async () => {
    const client = { sendNotification: jest.fn() };
    const adapter = new DanAiAdapter(client);

    await expect(adapter.notify({ title: 'Incomplete' }))
      .rejects.toThrow('idempotencyKey is required');
    expect(client.sendNotification).not.toHaveBeenCalled();
  });
});
