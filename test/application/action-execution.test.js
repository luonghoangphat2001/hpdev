'use strict';

const ActionExecutionService = require('../../src/application/services/action-execution.service');

describe('ActionExecutionService', () => {
  const action = {
    action_id: 'act_1',
    action_name: 'ops.order_status.update',
    request_payload: '{"order_id":1,"target_status":"processing"}',
    idempotency_key: `idem:v1:order:${'a'.repeat(64)}`,
    expected_resource_version: 'version-7',
  };

  it('pins version precondition and persists a hashed SSOT receipt', async () => {
    const receipt = {
      action_id: 'remote_1',
      idempotency_key: action.idempotency_key,
      status: 'completed',
      resource_type: 'order',
      resource_id: '1',
      resource_version: 'version-8',
      executed_at: '2026-07-25T00:00:00.000Z',
    };
    const writeAdapter = { execute: jest.fn().mockResolvedValue(receipt) };
    const actionRepository = {
      markCompleted: jest.fn(),
      markManualReview: jest.fn(),
    };
    const service = new ActionExecutionService({
      writeAdapter,
      actionRepository,
      clock: () => new Date('2026-07-25T00:00:01.000Z'),
    });

    await expect(service.execute(action, {
      grantedPermissions: ['order_status.update'],
    })).resolves.toMatchObject({
      action_id: 'act_1',
      status: 'completed',
      receipt,
      receipt_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(writeAdapter.execute).toHaveBeenCalledWith(
      'ops.order_status.update',
      { order_id: 1, target_status: 'processing' },
      expect.objectContaining({
        actionId: 'act_1',
        idempotencyKey: action.idempotency_key,
        expectedResourceVersion: 'version-7',
      }),
    );
    expect(actionRepository.markCompleted).toHaveBeenCalledWith(
      'act_1',
      receipt,
      expect.stringMatching(/^[a-f0-9]{64}$/),
      new Date('2026-07-25T00:00:01.000Z'),
    );
  });

  it('moves version conflicts to manual review without retrying execution', async () => {
    const conflict = Object.assign(new Error('Conflict'), {
      code: 'ssot_version_conflict',
    });
    const writeAdapter = { execute: jest.fn().mockRejectedValue(conflict) };
    const actionRepository = {
      markCompleted: jest.fn(),
      markManualReview: jest.fn(),
    };
    const service = new ActionExecutionService({ writeAdapter, actionRepository });

    await expect(service.execute(action, {
      grantedPermissions: ['order_status.update'],
    })).resolves.toMatchObject({
      status: 'manual_review',
      error: { code: 'resource_version_conflict' },
    });
    expect(writeAdapter.execute).toHaveBeenCalledTimes(1);
    expect(actionRepository.markManualReview).toHaveBeenCalledWith(
      'act_1',
      expect.objectContaining({ code: 'resource_version_conflict' }),
    );
    expect(actionRepository.markCompleted).not.toHaveBeenCalled();
  });

  it('does not swallow non-conflict execution failures', async () => {
    const failure = Object.assign(new Error('Unavailable'), {
      code: 'ssot_upstream_unavailable',
    });
    const service = new ActionExecutionService({
      writeAdapter: { execute: jest.fn().mockRejectedValue(failure) },
      actionRepository: { markManualReview: jest.fn() },
    });

    await expect(service.execute(action, {
      grantedPermissions: ['order_status.update'],
    })).rejects.toBe(failure);
  });
});
