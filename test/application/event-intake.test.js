'use strict';

const EventIntakeService = require('../../src/application/services/event-intake.service');
const EventIntakeController = require('../../src/controllers/event-intake.controller');
const EventIntakeValidation = require('../../src/validations/event-intake.validation');

describe('event intake application flow', () => {
  const payload = {
    event_id: 'evt_123',
    schema_version: '1.0.0',
    event: 'order.created',
    timestamp: '2026-07-25T00:00:00.000Z',
    data: { id: 123 },
    changes: {},
  };

  it('persists a verified supported event before returning a receipt', async () => {
    const eventRepository = {
      create: jest.fn().mockResolvedValue({ event_id: 'evt_123' }),
    };
    const service = new EventIntakeService({
      eventRepository,
      identifiers: { createId: jest.fn().mockReturnValue('cor_generated') },
      clock: () => new Date('2026-07-25T00:00:01.000Z'),
    });

    await expect(service.accept({
      payload,
      rawBody: Buffer.from(JSON.stringify(payload)),
      deliveryId: 'delivery_123',
      keyId: 'key_1',
    })).resolves.toEqual({
      event_id: 'evt_123',
      correlation_id: 'cor_generated',
      status: 'accepted',
    });
    expect(eventRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'evt_123',
      eventType: 'order.created',
      signatureValid: true,
      deliveryId: 'delivery_123',
      payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });

  it('rejects unknown events before persistence', async () => {
    const eventRepository = { create: jest.fn() };
    const service = new EventIntakeService({ eventRepository });

    await expect(service.accept({
      payload: { ...payload, event: 'unknown.created' },
      rawBody: '{}',
      deliveryId: 'delivery_123',
      keyId: 'key_1',
    })).rejects.toMatchObject({ statusCode: 422 });
    expect(eventRepository.create).not.toHaveBeenCalled();
  });

  it('requires verified signature metadata and a complete envelope', () => {
    const validation = new EventIntakeValidation();
    expect(() => validation.validate({ body: payload }))
      .toThrow('Verified webhook signature is required');
    expect(() => validation.validate({
      body: {},
      webhookVerification: { valid: true },
    })).toThrow('Invalid event envelope');
  });

  it('returns HTTP 202 only after the service resolves', async () => {
    const service = {
      accept: jest.fn().mockResolvedValue({
        event_id: 'evt_123',
        status: 'accepted',
      }),
    };
    const controller = new EventIntakeController(service, {
      validate: jest.fn().mockReturnValue({ payload }),
    });
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await controller.create({}, res);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      event_id: 'evt_123',
      status: 'accepted',
    });
  });
});
