'use strict';

const ReconciliationService = require('../../../src/services/workflow/state/reconciliation.service');

describe('ReconciliationService', () => {
  const now = new Date('2026-07-25T00:02:00.000Z');
  const action = {
    action_id: 'act_1',
    workflow_id: 'wf_1',
    event_id: 'evt_1',
    correlation_id: 'cor_1',
    action_name: 'ops.order_status.update',
    request_payload: '{"order_id":1,"target_status":"processing"}',
    payload_hash: 'a'.repeat(64),
    idempotency_key: 'idem:v1:order:key',
    retry_count: 1,
    max_attempts: 3,
    started_at: new Date('2026-07-25T00:00:00.000Z'),
  };

  function setup(lookup) {
    const actionRepository = {
      findReconciliationCandidates: jest.fn().mockResolvedValue([action]),
      markCompleted: jest.fn(),
      markRetryQueued: jest.fn(),
      markManualReview: jest.fn(),
    };
    const outboxRepository = { enqueue: jest.fn() };
    const deadLetterRepository = { create: jest.fn() };
    const receiptReader = { lookup: jest.fn().mockResolvedValue(lookup) };
    const service = new ReconciliationService({
      actionRepository,
      outboxRepository,
      deadLetterRepository,
      receiptReader,
      idFactory: {
        createId: (type) => (type === 'job' ? 'job_1' : 'dlq_1'),
      },
      clock: () => now,
      staleAfterMs: 60000,
    });
    return {
      service,
      actionRepository,
      outboxRepository,
      deadLetterRepository,
      receiptReader,
    };
  }

  it('uses an existing SSOT receipt without re-executing the action', async () => {
    const fixture = setup({
      status: 'found',
      receipt: { action_id: 'remote_1', status: 'completed' },
    });

    await expect(fixture.service.run()).resolves.toEqual([
      { action_id: 'act_1', status: 'reconciled' },
    ]);
    expect(fixture.actionRepository.markCompleted).toHaveBeenCalled();
    expect(fixture.outboxRepository.enqueue).not.toHaveBeenCalled();
  });

  it('queues a retry with the exact original idempotency key only when absence is proven', async () => {
    const fixture = setup({ status: 'not_found' });

    await expect(fixture.service.run()).resolves.toEqual([
      { action_id: 'act_1', status: 'retry_queued' },
    ]);
    expect(fixture.outboxRepository.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        jobKey: 'action-retry:act_1:2',
        payload: expect.objectContaining({
          idempotency_key: action.idempotency_key,
        }),
      }),
    );
    expect(fixture.actionRepository.markRetryQueued).toHaveBeenCalledWith('act_1');
  });

  it('moves ambiguous or exhausted results to manual review and dead-letter', async () => {
    const fixture = setup({ status: 'unknown' });

    await expect(fixture.service.run()).resolves.toEqual([
      { action_id: 'act_1', status: 'manual_review' },
    ]);
    expect(fixture.deadLetterRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: 'workflow_action',
        actionId: 'act_1',
        errorCode: 'external_result_unknown',
      }),
    );
    expect(fixture.actionRepository.markManualReview).toHaveBeenCalled();
    expect(fixture.outboxRepository.enqueue).not.toHaveBeenCalled();
  });

  it('queries only actions older than the stale threshold', async () => {
    const fixture = setup({ status: 'found', receipt: {} });
    await fixture.service.run(25);
    expect(fixture.actionRepository.findReconciliationCandidates)
      .toHaveBeenCalledWith(
        new Date('2026-07-25T00:01:00.000Z'),
        25,
      );
  });
});
