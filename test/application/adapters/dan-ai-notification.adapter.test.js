'use strict';

const DanAiNotificationAdapter = require('../../../src/application/adapters/dan-ai-notification.adapter');

describe('DanAiNotificationAdapter', () => {
  test('maps an orchestration notification to the dan_ai boundary', async () => {
    const client = {
      sendNotification: jest.fn().mockResolvedValue({ ok: true, notificationId: 12 }),
    };
    const adapter = new DanAiNotificationAdapter(client);

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
    const adapter = new DanAiNotificationAdapter(client);

    await expect(adapter.notify({ title: 'Incomplete' }))
      .rejects.toThrow('idempotencyKey is required');
    expect(client.sendNotification).not.toHaveBeenCalled();
  });
});
