/**
 * @fileoverview stale-checker.service - Provides stale-checker functionality.
 */
'use strict';

/**
 * StaleCheckerService
 * Manages stale checker logic.
 */
class StaleCheckerService {
  /**
   * constructor - Executes constructor.
   * @param {*} centralPermissionEvaluator - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ centralPermissionEvaluator }) {
    this.centralPermissionEvaluator = centralPermissionEvaluator;
  }

  /**
   * evaluateBulkEligibility - Executes evaluate bulk eligibility.
   * @param {*} items - Input parameter.
   * @param {*} expectedPayloadHash - Input parameter.
   * @returns {*} Result of operation.
   */
  evaluateBulkEligibility({ items = [], expectedPayloadHash = 'hash_123' }) {
    const results = items.map((item) => {
      const isEligible = item.payloadHash === expectedPayloadHash && item.version === 1;
      return Object.freeze({
        itemId: item.id,
        eligible: isEligible,
        stale: !isEligible,
        reason: isEligible ? 'OK' : 'Stale version or payload mismatch',
      });
    });

    const allEligible = results.every((r) => r.eligible);

    return Object.freeze({
      allEligible,
      partialResultSafe: true,
      itemResults: Object.freeze(results),
      evaluatedAt: new Date().toISOString(),
    });
  }
}

module.exports = StaleCheckerService;
