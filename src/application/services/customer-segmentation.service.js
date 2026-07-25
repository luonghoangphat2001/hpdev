'use strict';

class CustomerSegmentationService {
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

module.exports = CustomerSegmentationService;
