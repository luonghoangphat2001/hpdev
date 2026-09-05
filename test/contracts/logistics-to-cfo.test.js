'use strict';

const { createLogisticsToCfoHandoff } = require('@schemas/ai/handoffs/logistics-to-cfo');

describe('T064: Logistics -> CFO Handoff', () => {
  test('creates valid Logistics to CFO handoff', () => {
    const handoff = createLogisticsToCfoHandoff({
      handoffId: 'ho_log_cfo_1',
      workflowId: 'wf_102',
      purchaseOrderId: 'po_999',
      supplierId: 'sup_coffee_beans',
      totalAmount: 15000000,
      currency: 'VND',
      items: [{ id: 'ing_beans', qty: 100, price: 150000 }],
      deadlineAt: '2026-07-26T12:00:00.000Z',
    });

    expect(handoff.sourceAgent).toBe('dan_logistics');
    expect(handoff.targetAgent).toBe('dan_cfo');
    expect(handoff.payload.budgetImpact.estimatedCashOutflow).toBe(15000000);
  });
});
