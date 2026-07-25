'use strict';

const { createOpsToCskhHandoff } = require('../../src/contracts/handoffs/ops-to-cskh.handoff');

describe('T065: Ops -> CSKH Handoff', () => {
  test('creates valid Ops to CSKH handoff', () => {
    const handoff = createOpsToCskhHandoff({
      handoffId: 'ho_ops_cskh_1',
      workflowId: 'wf_103',
      orderId: 'ord_777',
      customerId: 'cust_888',
      incidentType: 'DELIVERY_DELAY',
      delayMinutes: 45,
      reason: 'Driver flat tire',
      deadlineAt: '2026-07-25T20:00:00.000Z',
    });

    expect(handoff.sourceAgent).toBe('dan_ops');
    expect(handoff.targetAgent).toBe('dan_cskh');
    expect(handoff.payload.customerRecoveryProposal.recommendedVoucherAmount).toBe(20000);
  });
});
