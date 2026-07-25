'use strict';

const OperatorControlService = require('../../src/application/services/operator-control.service');

function harness(state = 'running', pausedFromState = null) {
  const row = {
    workflow_id: 'wfl_1',
    event_id: 'evt_1',
    correlation_id: 'cor_1',
    state,
    paused_from_state: pausedFromState,
    policy_version: '1.0.0',
  };
  const repository = {
    findWorkflowForUpdate: jest.fn().mockResolvedValue(row),
    changeState: jest.fn().mockResolvedValue(true),
    saveFeedback: jest.fn(async (feedback) => feedback),
  };
  const audit = { append: jest.fn().mockResolvedValue({}) };
  const service = new OperatorControlService({
    transactionManager: { execute: (operation) => operation({}) },
    repositoryFactory: () => repository,
    auditRepositoryFactory: () => audit,
    allowedOperatorIds: ['ceo-1'],
    clock: () => new Date('2026-07-25T08:00:00Z'),
    idFactory: (prefix) => `${prefix}_1`,
  });
  return { service, repository, audit };
}

describe('OperatorControlService', () => {
  test('pauses with the resumable state and an append-only audit', async () => {
    const { service, repository, audit } = harness('running');
    await expect(service.control({
      workflowId: 'wfl_1',
      operation: 'pause',
      expectedVersion: 3,
      actorId: 'ceo-1',
      reason: 'Agent needs repair',
    })).resolves.toEqual({
      workflowId: 'wfl_1',
      state: 'paused',
      stateVersion: 4,
    });
    expect(repository.changeState).toHaveBeenCalledWith('wfl_1', 3, {
      state: 'paused',
      pausedFromState: 'running',
      completedAt: null,
    });
    expect(audit.append).toHaveBeenCalledWith(expect.objectContaining({
      auditType: 'workflow.pause',
      actorId: 'ceo-1',
    }));
  });

  test('resumes only to the state captured during pause', async () => {
    const { service } = harness('paused', 'awaiting_approval');
    await expect(service.control({
      workflowId: 'wfl_1',
      operation: 'resume',
      expectedVersion: 4,
      actorId: 'ceo-1',
    })).resolves.toMatchObject({ state: 'awaiting_approval' });
  });

  test('blocks unauthorized operators and stale versions', async () => {
    const { service, repository } = harness();
    await expect(service.control({
      workflowId: 'wfl_1',
      operation: 'pause',
      expectedVersion: 1,
      actorId: 'agent-hr',
    })).rejects.toMatchObject({ statusCode: 403 });
    repository.changeState.mockResolvedValue(false);
    await expect(service.control({
      workflowId: 'wfl_1',
      operation: 'pause',
      expectedVersion: 1,
      actorId: 'ceo-1',
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('stores bounded CEO feedback for future improvement', async () => {
    const { service, repository } = harness();
    await expect(service.feedback({
      workflowId: 'wfl_1',
      actorId: 'ceo-1',
      rating: 2,
      comment: 'Agent selected the wrong policy.',
    })).resolves.toMatchObject({
      feedbackId: 'fdb_1',
      rating: 2,
    });
    expect(repository.saveFeedback).toHaveBeenCalled();
  });
});
