'use strict';

const BaseProposalAgent = require('../../domain/agents/base-proposal.agent');
const FinancialAnalysisService = require('../../domain/agents/cfo/financial-analysis.service');

class CfoAgent extends BaseProposalAgent {
  constructor({
    readAdapter,
    writeAdapter,
    analyzer = new FinancialAnalysisService(),
    idFactory,
    clock,
  }) {
    super({
      agentId: 'dan_cfo',
      proposalTypes: ['reconciliation', 'refund'],
      idFactory,
      clock,
    });
    this.readAdapter = readAdapter;
    this.writeAdapter = writeAdapter;
    this.analyzer = analyzer;
  }

  async reconcile({ workflowId, period }) {
    const result = await this.readAdapter.getFinanceSummary(period);
    const analysis = this.analyzer.reconcile(result.data);
    return this.createProposal({
      workflowId,
      type: 'reconciliation',
      summary: analysis.balanced
        ? 'Đối soát cân bằng'
        : `Chênh lệch đối soát: ${analysis.variance}`,
      evidence: [{
        source_ref: `finance-summary:${period}`,
        ...analysis,
      }],
      recommendations: analysis.balanced
        ? []
        : [{ recommendation: 'manual_reconciliation_review' }],
      requestedActions: [],
    });
  }

  async refund({
    workflowId,
    orderId,
    amount,
    reason,
    execute = false,
    actionId,
    idempotencyKey,
    grantedPermissions,
    approval = null,
  }) {
    const orderResult = await this.readAdapter.getOrder(orderId);
    const refundable = this.analyzer.assertRefundEligible(orderResult.data, amount);
    const actionPayload = { order_id: orderId, amount, reason };
    const proposal = this.createProposal({
      workflowId,
      type: 'refund',
      summary: `Đề xuất hoàn ${amount} cho đơn ${orderId}`,
      evidence: [{
        source_ref: `order:${orderId}`,
        order_total: Number(orderResult.data.total || 0),
        refundable_amount: refundable,
      }],
      recommendations: [{ recommendation: 'review_refund' }],
      requestedActions: [{
        action: 'finance.refund.execute',
        payload: actionPayload,
        approval_required: true,
      }],
    });

    if (!execute) {
      return Object.freeze({ proposal, receipt: null });
    }

    const receipt = await this.writeAdapter.executeRefund(actionPayload, {
      actionId,
      idempotencyKey,
      grantedPermissions,
      approval,
    });
    return Object.freeze({ proposal, receipt });
  }
}

module.exports = CfoAgent;
