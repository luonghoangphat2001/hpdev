'use strict';

const DecisionJournalPolicy = require('../../../src/policy/compliance/decision-journal.policy');

describe('DecisionJournalPolicy', () => {
  test('stores rationale, redacted inputs, policy and immutable input hash', async () => {
    const repository = { create: jest.fn(async (entry) => entry) };
    const service = new DecisionJournalPolicy({
      repository,
      clock: () => new Date('2026-07-25T08:00:00Z'),
      idFactory: () => 'dec_1',
    });
    const entry = await service.record({
      workflowId: 'wfl_1',
      approvalId: 'apr_1',
      actorId: 'ceo-1',
      decisionType: 'approval',
      decision: 'approve',
      rationale: 'Margin and evidence checked',
      inputSnapshot: {
        orderId: 10,
        customerEmail: 'customer@example.com',
      },
      policyVersion: '1.0.0',
      expectedOutcome: { refundCompleted: true },
    });

    expect(entry).toMatchObject({
      decisionId: 'dec_1',
      rationale: 'Margin and evidence checked',
      inputSnapshot: {
        orderId: 10,
        customerEmail: '[REDACTED]',
      },
      inputHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      policyVersion: '1.0.0',
    });
  });

  test('records the actual outcome only once', async () => {
    const repository = {
      recordOutcome: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
    };
    const service = new DecisionJournalPolicy({ repository });
    await expect(service.recordOutcome('dec_1', {
      status: 'positive',
      outcome: { repeatOrderRate: 0.4 },
    })).resolves.toEqual({ decisionId: 'dec_1', status: 'positive' });
    await expect(service.recordOutcome('dec_1', {
      status: 'negative',
      outcome: {},
    })).rejects.toMatchObject({ statusCode: 409 });
  });
});
