'use strict';

const SignaturePolicy = require('../../src/policy/permissions/signature.policy');
const {
  WebhookVerificationMiddleware,
  parseSigningKeys,
  unavailableMiddleware,
} = require('../../src/middleware/webhook-verification.middleware');

describe('WebhookVerificationMiddleware', () => {
  const nowSeconds = 1784966400;
  const signatureService = new SignaturePolicy({
    keys: { current: 'secret' },
    now: () => nowSeconds * 1000,
  });
  const body = Buffer.from('{"event_id":"evt_1"}');

  function request(signature) {
    const headers = {
      'x-openclaw-timestamp': String(nowSeconds),
      'x-openclaw-delivery-id': 'delivery_1',
      'x-openclaw-key-id': 'current',
      'x-openclaw-signature': signature,
    };
    return {
      body: { event_id: 'evt_1' },
      rawBody: body,
      get: (name) => headers[name],
    };
  }

  function response() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  it('attaches verified metadata before continuing', async () => {
    const signature = signatureService.sign({
      body,
      timestamp: nowSeconds,
      deliveryId: 'delivery_1',
      keyId: 'current',
    });
    const req = request(signature);
    const next = jest.fn();
    const middleware = new WebhookVerificationMiddleware({
      signatureService,
      eventRepository: {
        findByDeliveryId: jest.fn().mockResolvedValue(null),
        findByEventId: jest.fn().mockResolvedValue(null),
      },
    });

    await middleware.handle(req, response(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.webhookVerification).toMatchObject({
      valid: true,
      deliveryId: 'delivery_1',
      keyId: 'current',
    });
  });

  it('rejects invalid signatures before database lookup', async () => {
    const repository = {
      findByDeliveryId: jest.fn(),
      findByEventId: jest.fn(),
    };
    const res = response();
    const middleware = new WebhookVerificationMiddleware({
      signatureService,
      eventRepository: repository,
    });

    await middleware.handle(request('v1=invalid'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(repository.findByDeliveryId).not.toHaveBeenCalled();
  });

  it('returns the original event receipt for replayed delivery', async () => {
    const signature = signatureService.sign({
      body,
      timestamp: nowSeconds,
      deliveryId: 'delivery_1',
      keyId: 'current',
    });
    const res = response();
    const middleware = new WebhookVerificationMiddleware({
      signatureService,
      eventRepository: {
        findByDeliveryId: jest.fn().mockResolvedValue({
          event_id: 'evt_original',
          correlation_id: 'cor_original',
        }),
        findByEventId: jest.fn(),
      },
    });

    await middleware.handle(request(signature), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      event_id: 'evt_original',
      correlation_id: 'cor_original',
      status: 'duplicate',
    });
  });

  it('fails closed when signing key configuration is absent or invalid', () => {
    expect(parseSigningKeys('')).toBeNull();
    expect(parseSigningKeys('{invalid')).toBeNull();
    expect(parseSigningKeys('{"current":"secret"}')).toEqual({ current: 'secret' });

    const res = response();
    unavailableMiddleware({}, res);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
