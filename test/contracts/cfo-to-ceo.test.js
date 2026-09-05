'use strict';

const { createCfoToCeoEscalationHandoff } = require('@schemas/ai/handoffs/cfo-to-ceo');

describe('T067: CFO -> CEO Escalation Handoff', () => {
  test('creates valid CFO to CEO escalation handoff', () => {
    const handoff = createCfoToCeoEscalationHandoff({
      handoffId: 'ho_cfo_ceo_1',
      workflowId: 'wf_105',
      exceptionType: 'LARGE_REFUND_REQUEST',
      amount: 10000000,
      currency: 'VND',
      riskLevel: 'HIGH',
      reason: 'Refund amount exceeds 500k auto limit',
      deadlineAt: '2026-07-25T22:00:00.000Z',
    });

    expect(handoff.sourceAgent).toBe('dan_cfo');
    expect(handoff.targetAgent).toBe('ceo');
    expect(handoff.payload.ceoInboxProposal.action).toBe('require_ceo_approval');
  });
});
