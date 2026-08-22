'use strict';

const ServiceAuthMiddleware = require('../../src/middleware/ServiceAuthMiddleware');

describe('ServiceAuthMiddleware', () => {
  const response = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  afterEach(() => {
    delete process.env.OPENCLAW_NOTIFICATION_SECRET;
  });

  test('accepts the dedicated inbound Bearer secret', () => {
    process.env.OPENCLAW_NOTIFICATION_SECRET = 'notification-secret';
    const next = jest.fn();

    ServiceAuthMiddleware.openClaw(
      { headers: { authorization: 'Bearer notification-secret' } },
      response(),
      next
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('fails closed when the secret is missing or wrong', () => {
    process.env.OPENCLAW_NOTIFICATION_SECRET = 'notification-secret';
    const res = response();

    ServiceAuthMiddleware.openClaw(
      { headers: { authorization: 'Bearer wrong' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });
});
