'use strict';

const ReplayService = require('../../../src/services/operator/event/replay.service');

const event = {
  event_id: 'evt_1',
  event_type: 'order.updated',
  correlation_id: 'cor_1',
  raw_payload: JSON.stringify({ order_id: 1 }),
  status: 'failed',
};

describe('ReplayService', () => {
  test('dry-runs with writes forcibly disabled', async () => {
    const simulator = {
      simulate: jest.fn().mockResolvedValue({ outcome: 'would_create_proposal' }),
    };
    const service = new ReplayService({
      eventRepository: { findByEventId: jest.fn().mockResolvedValue(event) },
      simulator,
      allowedOperatorIds: ['ceo-1'],
      idFactory: () => 'rpl_1',
    });

    await expect(service.replay({
      eventId: 'evt_1',
      dryRun: true,
      actorId: 'ceo-1',
    })).resolves.toEqual({
      replayId: 'rpl_1',
      mode: 'dry_run',
      simulation: { outcome: 'would_create_proposal' },
    });
    expect(simulator.simulate).toHaveBeenCalledWith(expect.objectContaining({
      originalEventId: 'evt_1',
      writesAllowed: false,
    }));
  });

  test('keeps live replay behind production gate', async () => {
    const service = new ReplayService({
      eventRepository: { findByEventId: jest.fn().mockResolvedValue(event) },
      simulator: {},
      allowedOperatorIds: ['ceo-1'],
      productionEnabled: false,
    });
    await expect(service.replay({
      eventId: 'evt_1',
      dryRun: false,
      actorId: 'ceo-1',
    })).rejects.toMatchObject({ statusCode: 409 });
  });
});
