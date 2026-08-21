'use strict';

const FeedbackLoopService = require('../../../src/services/ai/research/feedback-loop.service');

describe('T105: Customer Feedback Closed Loop Service', () => {
  test('traces feedback loop from root cause to verified KPI action', () => {
    const service = new FeedbackLoopService();
    const result = service.traceLoop({
      feedbackId: 'fb_100',
      rootCause: 'Slow ice blending',
      actionTaken: 'Upgrade blender machine',
      kpiVerification: { verified: true, metric: 'fulfillment_time_seconds', improvementPercent: 20 },
    });

    expect(result.closedLoopVerified).toBe(true);
    expect(result.actionTaken).toBe('Upgrade blender machine');
  });
});
