'use strict';

const DiscordNotificationController = require('../../src/controllers/DiscordNotificationController');

describe('DiscordNotificationController', () => {
  const response = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  test('returns 202 when a notification is newly queued', async () => {
    const service = { enqueue: jest.fn().mockResolvedValue({ id: 11, duplicate: false }) };
    const controller = new DiscordNotificationController(service);
    const res = response();

    await controller.create({ body: { idempotencyKey: 'k' } }, res);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ ok: true, notificationId: 11, duplicate: false });
  });

  test('returns a safe validation error', async () => {
    const service = { enqueue: jest.fn().mockRejectedValue(new TypeError('invalid payload')) };
    const controller = new DiscordNotificationController(service);
    const res = response();

    await controller.create({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'invalid payload' });
  });
});
