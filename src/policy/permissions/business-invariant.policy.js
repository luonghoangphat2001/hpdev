/**
 * @fileoverview business-invariant.policy - Provides business-invariant functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

/**
 * BusinessInvariantPolicy
 * Manages business invariant logic.
 */
class BusinessInvariantPolicy extends BasePolicy {
  constructor(options = {}) {
    super({ name: 'BusinessInvariantPolicy' });


  }
  /**
   * verifyInvariants - Executes verify invariants.
   * @param {*} actionType - Input parameter.
   * @param {*} payload - Input parameter.
   * @returns {*} Result of operation.
   */
  verifyInvariants({ actionType, payload = {} }) {
    switch (actionType) {
      case 'cfo.refund.issue': {
        if (typeof payload.amount !== 'number' || payload.amount <= 0) {
          return Object.freeze({ passed: false, error: 'Refund amount must be a positive number' });
        }
        break;
      }
      case 'logistics.purchase_order.create': {
        if (!Array.isArray(payload.items) || payload.items.length === 0) {
          return Object.freeze({ passed: false, error: 'Purchase order must contain at least one item' });
        }
        break;
      }
      case 'cskh.voucher.create': {
        if (typeof payload.voucherValue !== 'number' || payload.voucherValue > 500000) {
          return Object.freeze({ passed: false, error: 'Voucher value exceeds invariant limit (500,000)' });
        }
        break;
      }
      default:
        break;
    }

    return Object.freeze({ passed: true, error: null });
  }
}

module.exports = BusinessInvariantPolicy;
