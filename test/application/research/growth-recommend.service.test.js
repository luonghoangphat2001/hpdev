'use strict';

const GrowthRecommendService = require('@services/ai/research/growth-recommend.service');

describe('T104: Growth Recommendation Service', () => {
  test('generates advisory growth recommendation without auto-spend', () => {
    const service = new GrowthRecommendService();
    const result = service.generateRecommendations({
      opportunities: [{ productName: 'Matcha Latte' }],
      cohorts: { VIP: ['c1'] },
    });

    expect(result.recommendations.length).toBe(1);
    expect(result.recommendations[0].autoSpendAllowed).toBe(false);
    expect(result.recommendations[0].requiresCEOApproval).toBe(true);
  });
});
