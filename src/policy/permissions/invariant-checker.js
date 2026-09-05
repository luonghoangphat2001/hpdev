/**
 * @fileoverview invariant-checker - Provides invariant-checker functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

/**
 * InvariantChecker
 * Manages invariant checker logic.
 */
class InvariantChecker extends BasePolicy {
  constructor(options = {}) {
    super({ name: 'InvariantChecker' });


  }
  /**
   * assert - Executes assert.
   * @param {*} proposal - Input parameter.
   * @param {*} action - Input parameter.
   * @returns {*} Result of operation.
   */
  assert(proposal, action) {
    if (!proposal.evidence?.length) {
      throw this.#error('proposal_evidence_required');
    }
    const payload = action.payload || {};
    switch (action.action) {
      case 'finance.refund.execute':
        this.#assertRefund(proposal, payload);
        break;
      case 'inventory.purchase_order_draft.create':
        if (Number(payload.total_amount) < 0) throw this.#error('purchase_order_total_invalid');
        break;
      case 'cskh.voucher.issue':
        if (Number(payload.amount) <= 0) throw this.#error('voucher_amount_invalid');
        break;
      default:
        break;
    }
    return true;
  }

  #assertRefund(proposal, payload) {
    const orderEvidence = proposal.evidence.find(({ source_ref: sourceRef }) =>
      sourceRef === `order:${payload.order_id}`);
    if (!orderEvidence) throw this.#error('refund_order_evidence_missing');
    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0
      || amount > Number(orderEvidence.refundable_amount)) {
      throw this.#error('refund_amount_exceeds_evidence');
    }
  }

  #error(code) {
    const error = new Error('Proposal violates business invariant');
    error.code = code;
    return error;
  }
}

module.exports = InvariantChecker;
