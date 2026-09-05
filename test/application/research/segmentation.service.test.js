'use strict';

const SegmentationService = require('@services/ai/research/segmentation.service');

describe('T100: Customer Segmentation and Cohort Analysis Service', () => {
  test('segments customers into VIP, REGULAR, and AT_RISK cohorts', () => {
    const service = new SegmentationService();
    const result = service.segmentCustomers({
      customers: [
        { id: 'c1', totalSpent: 15000000, daysSinceLastOrder: 5 },
        { id: 'c2', totalSpent: 2000000, daysSinceLastOrder: 45 },
        { id: 'c3', totalSpent: 1000000, daysSinceLastOrder: 10 },
      ],
    });

    expect(result.cohorts.VIP).toContain('c1');
    expect(result.cohorts.AT_RISK).toContain('c2');
    expect(result.cohorts.REGULAR).toContain('c3');
  });
});
