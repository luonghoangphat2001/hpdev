'use strict';

const { createCrossAgentHandoffDto } = require('../dto/cross-agent-handoff.dto');

function createLogisticsToCfoHandoff({
  handoffId,
  workflowId,
  purchaseOrderId,
  supplierId,
  totalAmount = 0,
  currency = 'VND',
  items = [],
  deadlineAt,
}) {
  if (!purchaseOrderId || !supplierId) {
    throw new Error('purchaseOrderId and supplierId are required for Logistics -> CFO handoff');
  }

  const payload = {
    purchaseOrderId,
    supplierId,
    totalAmount,
    currency,
    items,
    budgetImpact: {
      estimatedCashOutflow: totalAmount,
      currency,
    },
  };

  return createCrossAgentHandoffDto({
    handoffId,
    sourceAgent: 'dan_logistics',
    targetAgent: 'dan_cfo',
    workflowId,
    contextRefs: [`purchase_order:${purchaseOrderId}`],
    payload,
    expectedResult: 'verify_budget_and_cash_flow_impact',
    deadlineAt,
  });
}

module.exports = {
  createLogisticsToCfoHandoff,
};
