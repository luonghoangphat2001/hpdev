/**
 * @fileoverview cskh.agent - Provides cskh.agent functionality.
 */
'use strict';

const BaseProposalAgent = require('./base-proposal.agent');
const RecoveryService = require('./cskh/recovery.service');

/**
 * CskhAgent
 * Manages cskh agent logic.
 */
class CskhAgent extends BaseProposalAgent {
  constructor({
    readAdapter,
    writeAdapter,
    recovery = new RecoveryService(),
    idFactory,
    clock,
  }) {
    super({
      agentId: 'dan_cskh',
      proposalTypes: ['customer_recovery'],
      idFactory,
      clock,
    });
    this.readAdapter = readAdapter;
    this.writeAdapter = writeAdapter;
    this.recovery = recovery;
  }

  async execute({
    workflowId,
    feedbackId,
    customerId,
    voucherCode,
    voucherExpiry,
    executeResponse = false,
    executeVoucher = false,
    responseAction = {},
    voucherAction = {},
  }) {
    const feedbackResult = await this.readAdapter.listCustomerFeedback({});
    const feedback = feedbackResult.data.find(
      (item) => String(item.id) === String(feedbackId),
    );
    if (!feedback) {
      const error = new Error(`Customer feedback not found: ${feedbackId}`);
      error.code = 'customer_feedback_not_found';
      throw error;
    }

    const recovery = this.recovery.build(feedback);
    const responsePayload = {
      feedback_id: feedbackId,
      reply_content: recovery.reply_content,
      confidence: recovery.confidence,
    };
    const requestedActions = [{
      action: 'cskh.response.send',
      payload: responsePayload,
    }];
    let voucherPayload = null;

    if (recovery.severe) {
      voucherPayload = {
        customer_id: customerId,
        code: voucherCode,
        type: 'fixed',
        amount: recovery.voucher_amount,
        expiry_date: voucherExpiry,
        confidence: recovery.confidence,
      };
      requestedActions.push({
        action: 'cskh.voucher.issue',
        payload: voucherPayload,
      });
    }

    const proposal = this.createProposal({
      workflowId,
      type: 'customer_recovery',
      summary: recovery.severe
        ? `Phản hồi tiêu cực ${feedbackId} cần ưu tiên xử lý`
        : `Phản hồi ${feedbackId} đã có bản nháp`,
      evidence: [{
        source_ref: `customer-feedback:${feedbackId}`,
        rating: feedback.rating,
        sentiment: feedback.sentiment,
      }],
      recommendations: [{
        recommendation: 'review_response_draft',
        reply_content: recovery.reply_content,
      }],
      requestedActions,
    });

    const receipts = {};
    if (executeResponse) {
      receipts.response = await this.writeAdapter.sendCustomerResponse(
        responsePayload,
        responseAction,
      );
    }
    if (executeVoucher) {
      if (!voucherPayload) {
        const error = new Error('Voucher is not justified for this feedback');
        error.code = 'voucher_not_justified';
        throw error;
      }
      receipts.voucher = await this.writeAdapter.issueVoucher(
        voucherPayload,
        voucherAction,
      );
    }

    return Object.freeze({ proposal, receipts: Object.freeze(receipts) });
  }
}

module.exports = CskhAgent;
