'use strict';

const LifecycleService =
  require('../../../src/services/ai/lifecycle/lifecycle.service');

function harness(state = 'ACTIVE', version = 2) {
  const repository = {
    findForUpdate: jest.fn().mockResolvedValue({
      agent_id: 'dan_ops',
      lifecycle_state: state,
      state_version: version,
    }),
    transition: jest.fn().mockResolvedValue(true),
  };
  const audit = { append: jest.fn().mockResolvedValue({}) };
  const service = new LifecycleService({
    transactionManager: { execute: (operation) => operation({}) },
    repositoryFactory: () => repository,
    auditRepositoryFactory: () => audit,
    agentRegistry: { get: (id) => id === 'dan_ops' ? { id } : null },
    allowedActorIds: ['ceo-dashboard'],
    clock: () => new Date('2026-07-25T12:00:00.000Z'),
    idFactory: () => 'aud_agent_1',
  });
  return { service, repository, audit };
}

describe('T143 supplemental: persistent agent lifecycle service', () => {
  test('persists an authorized transition with optimistic version control', async () => {
    const { service, repository, audit } = harness();

    await expect(service.transition({
      agentId: 'dan_ops',
      toState: 'PAUSED',
      expectedVersion: 2,
      actorId: 'ceo-dashboard',
      reason: 'Investigate incorrect order handling',
    })).resolves.toMatchObject({
      agentId: 'dan_ops',
      fromState: 'ACTIVE',
      lifecycleState: 'PAUSED',
      stateVersion: 3,
    });
    expect(repository.transition).toHaveBeenCalledWith('dan_ops', 2, expect.objectContaining({
      lifecycleState: 'PAUSED',
      changedBy: 'ceo-dashboard',
    }));
    expect(audit.append).toHaveBeenCalledWith(expect.objectContaining({
      auditType: 'agent.lifecycle.transition',
      actorId: 'ceo-dashboard',
      fromState: 'ACTIVE',
      toState: 'PAUSED',
    }));
  });

  test('rejects unauthorized, stale and unsafe transitions', async () => {
    const { service } = harness('QUARANTINED', 4);
    await expect(service.transition({
      agentId: 'dan_ops',
      toState: 'ACTIVE',
      expectedVersion: 4,
      actorId: 'ceo-dashboard',
      reason: 'Skip repair',
    })).rejects.toMatchObject({ statusCode: 409 });
    await expect(service.transition({
      agentId: 'dan_ops',
      toState: 'FIXING',
      expectedVersion: 3,
      actorId: 'ceo-dashboard',
      reason: 'Repair isolated agent',
    })).rejects.toMatchObject({ statusCode: 409 });
    await expect(service.transition({
      agentId: 'dan_ops',
      toState: 'FIXING',
      expectedVersion: 4,
      actorId: 'not-ceo',
      reason: 'Unauthorized',
    })).rejects.toMatchObject({ statusCode: 403 });
  });
});
