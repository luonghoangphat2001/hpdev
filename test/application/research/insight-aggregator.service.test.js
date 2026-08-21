'use strict';

const InsightAggregatorService = require('../../../src/services/ai/research/insight-aggregator.service');

describe('T099: Customer Insight Aggregator Service', () => {
  test('aggregates and redacts PII from reviews and tickets', () => {
    const mockPii = { redactText: jest.fn(t => t.replace('0912345678', '0*********')) };
    const service = new InsightAggregatorService({ piiRedactorService: mockPii });

    const res = service.aggregateInsights({
      reviews: [{ id: 'r1', comment: 'Great drink, call 0912345678' }],
      tickets: [{ id: 't1', description: 'Late delivery' }],
    });

    expect(res.totalCount).toBe(2);
    expect(res.summary).not.toContain('0912345678');
    expect(res.evidenceRefs.length).toBe(2);
  });
});
