'use strict';

const { createCrossAgentHandoffDto } = require('../dto/cross-agent-handoff.dto');

function createCfoToCeoEscalationHandoff({
  handoffId,
  workflowId,
  exceptionType = 'CASH_FLOW_DEFICIT',
  amount = 0,
  currency = 'VND',
  riskLevel = 'HIGH',
  reason = '',
  deadlineAt,
}) {
  if (!exceptionType || amount <= 0) {
    throw new Error('exceptionType and positive amount are required for CFO -> CEO escalation');
  }

  const payload = {
    exceptionType,
    amount,
    currency,
    riskLevel,
    reason,
    ceoInboxProposal: {
      action: 'require_ceo_approval',
      recommendedDecision: 'review_cash_outflow_and_approve_credit_line',
    },
  };

  return createCrossAgentHandoffDto({
    handoffId,
    sourceAgent: 'dan_cfo',
    targetAgent: 'ceo',
    workflowId,
    contextRefs: [`financial_exception:${exceptionType}`],
    payload,
    expectedResult: 'ceo_decision_in_exception_inbox',
    deadlineAt,
  });
}

module.exports = {
  createCfoToCeoEscalationHandoff,
};
