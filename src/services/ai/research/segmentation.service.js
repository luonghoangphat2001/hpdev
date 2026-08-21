/**
 * @fileoverview segmentation.service - Provides segmentation functionality.
 */
'use strict';

/**
 * SegmentationService
 * Manages segmentation logic.
 */
class SegmentationService {
  /**
   * segmentCustomers - Executes segment customers.
   * @param {*} customers - Input parameter.
   * @returns {*} Result of operation.
   */
  segmentCustomers({ customers = [] }) {
    const cohorts = {
      VIP: [],
      REGULAR: [],
      AT_RISK: [],
    };

    for (const c of customers) {
      if (c.totalSpent > 10000000) {
        cohorts.VIP.push(c.id);
      } else if (c.daysSinceLastOrder > 30) {
        cohorts.AT_RISK.push(c.id);
      } else {
        cohorts.REGULAR.push(c.id);
      }
    }

    return Object.freeze({
      cohorts: Object.freeze(cohorts),
      analyzedAt: new Date().toISOString(),
    });
  }
}

module.exports = SegmentationService;
