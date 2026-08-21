/**
 * @fileoverview ops-to-cskh - Provides ops-to-cskh functionality.
 */
'use strict';

const { createCrossAgentHandoffDto } = require('../handoff.dto');

function createOpsToCskhHandoff({
  handoffId,
  workflowId,
  orderId,
  customerId,
  incidentType = 'DELIVERY_DELAY',
  delayMinutes = 0,
  reason = '',
  deadlineAt,
}) {
  if (!orderId || !customerId) {
    throw new Error('orderId and customerId are required for Ops -> CSKH handoff');
  }

  const payload = {
    orderId,
    customerId,
    incidentType,
    delayMinutes,
    reason,
    customerRecoveryProposal: {
      action: 'offer_apology_voucher',
      recommendedVoucherAmount: delayMinutes > 30 ? 20000 : 10000,
    },
  };

  return createCrossAgentHandoffDto({
    handoffId,
    sourceAgent: 'dan_ops',
    targetAgent: 'dan_cskh',
    workflowId,
    contextRefs: [`order:${orderId}`, `customer:${customerId}`],
    payload,
    expectedResult: 'propose_customer_recovery_and_apology',
    deadlineAt,
  });
}

module.exports = {
  createOpsToCskhHandoff,
};
