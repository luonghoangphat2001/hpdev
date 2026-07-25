'use strict';

const ApprovalDecisionService = require('../../src/application/services/approval-decision.service');

function createHarness(overrides = {}) {
  const now = new Date('2026-07-25T08:00:00.000Z');
  const row = {
    approval_id: 'apr_1',
    workflow_id: 'wfl_1',
    action_id: 'act_1',
    correlation_id: 'cor_1',
    event_id: 'evt_1',
    status: 'pending',
    decision_version: 1,
    expires_at: '2026-07-25T09:00:00.000Z',
    ...overrides,
  };
  const audit = { append: jest.fn().mockResolvedValue({ auditId: 'aud_1' }) };
  const repo = {
    findByApprovalIdForUpdate: jest.fn(async () => row),
    decidePending: jest.fn(async (_id, decision) => {
      if (row.status !== 'pending' || row.decision_version !== decision.expectedVersion) return false;
      row.status = decision.status;
      row.decision_version += 1;
      return true;
    }),
    markExpired: jest.fn(async () => {
      row.status = 'expired';
      row.decision_version += 1;
      return true;
    }),
  };
  let transactionTail = Promise.resolve();
  const transactionManager = {
    execute: jest.fn((operation) => {
      const transaction = transactionTail.then(() => operation({}));
      transactionTail = transaction.catch(() => {});
      return transaction;
    }),
  };
  const service = new ApprovalDecisionService({
    transactionManager,
    approvalRepositoryFactory: () => repo,
    auditRepositoryFactory: () => audit,
    allowedApproverIds: ['ceo-123'],
    clock: () => now,
    idFactory: () => 'aud_1',
  });
  return { service, repo, audit, row };
}

const approveCommand = Object.freeze({
  approvalId: 'apr_1',
  decision: 'approve',
  decisionVersion: 1,
  actorId: 'ceo-123',
  reason: 'Checked',
});

describe('ApprovalDecisionService', () => {
  test('atomically consumes an approval and writes its audit event', async () => {
    const { service, repo, audit } = createHarness();

    await expect(service.decide(approveCommand)).resolves.toMatchObject({
      approval_id: 'apr_1',
      action_id: 'act_1',
      status: 'consumed',
      decision_version: 2,
      decided_by: 'ceo-123',
    });
    expect(repo.decidePending).toHaveBeenCalledWith('apr_1', expect.objectContaining({
      status: 'consumed',
      expectedVersion: 1,
    }));
    expect(audit.append).toHaveBeenCalledWith(expect.objectContaining({
      approvalId: 'apr_1',
      actorType: 'ceo',
      auditType: 'approval_consumed',
    }));
  });

  test('stores rejection without producing a consumable approval', async () => {
    const { service, audit } = createHarness();

    await expect(service.decide({
      ...approveCommand,
      decision: 'reject',
    })).resolves.toMatchObject({ status: 'rejected' });
    expect(audit.append).toHaveBeenCalledWith(expect.objectContaining({
      auditType: 'approval_rejected',
      toState: 'rejected',
    }));
  });

  test('expires stale pending approvals and blocks the decision', async () => {
    const { service, repo } = createHarness({
      expires_at: '2026-07-25T07:59:59.000Z',
    });

    await expect(service.decide(approveCommand)).rejects.toMatchObject({
      statusCode: 410,
      details: { code: 'approval_expired' },
    });
    expect(repo.markExpired).toHaveBeenCalledWith('apr_1', expect.any(Date));
  });

  test('blocks replay after a decision has already been consumed', async () => {
    const { service } = createHarness({ status: 'consumed' });

    await expect(service.decide(approveCommand)).rejects.toMatchObject({
      statusCode: 409,
      details: {
        code: 'approval_replay_blocked',
        currentStatus: 'consumed',
      },
    });
  });

  test('allows exactly one winner when two decisions race', async () => {
    const { service, audit } = createHarness();

    const results = await Promise.allSettled([
      service.decide(approveCommand),
      service.decide({ ...approveCommand, decision: 'reject' }),
    ]);

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1);
    expect(results.find(({ status }) => status === 'rejected').reason)
      .toMatchObject({ details: { code: 'approval_replay_blocked' } });
    expect(audit.append).toHaveBeenCalledTimes(1);
  });

  test('requires an allowlisted CEO identity and expected version', async () => {
    const { service } = createHarness();

    await expect(service.decide({ ...approveCommand, actorId: 'agent-hr' }))
      .rejects.toMatchObject({ statusCode: 403 });
    await expect(service.decide({ ...approveCommand, decisionVersion: 0 }))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});
