'use strict';

const AgentAutonomyService = require('../../../src/services/ai/lifecycle/agent-autonomy.service');

describe('AgentAutonomyService', () => {
  test('lets CEO pause or configure one agent with optimistic limits', async () => {
    const repository = { upsert: jest.fn().mockResolvedValue(true) };
    const service = new AgentAutonomyService({
      repository,
      allowedActorIds: ['ceo-1'],
      clock: () => new Date('2026-07-25T08:00:00Z'),
    });
    await expect(service.configure({
      agentId: 'dan_cfo',
      autonomyLevel: 'PROPOSE',
      limits: { maxDailyActions: 5 },
      enabled: false,
      actorId: 'ceo-1',
      expectedVersion: 3,
    })).resolves.toMatchObject({
      agentId: 'dan_cfo',
      autonomyLevel: 'PROPOSE',
      enabled: false,
      changedBy: 'ceo-1',
    });
    expect(repository.upsert).toHaveBeenCalledWith(expect.any(Object), 3);
  });

  test('blocks non-CEO actors and unknown agents', async () => {
    const repository = { upsert: jest.fn() };
    const service = new AgentAutonomyService({
      repository,
      allowedActorIds: ['ceo-1'],
    });
    await expect(service.configure({
      agentId: 'dan_cfo',
      autonomyLevel: 'OBSERVE',
      actorId: 'agent-hr',
    })).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.configure({
      agentId: 'dan_unknown',
      autonomyLevel: 'OBSERVE',
      actorId: 'ceo-1',
    })).rejects.toThrow('Unknown agent');
  });
});
