'use strict';

const { createOutputConfidenceContract } = require('@schemas/ai/confidence.contract');

describe('T079: Output Confidence Contract', () => {
  test('creates valid confidence contract', () => {
    const contract = createOutputConfidenceContract({
      conclusion: 'Reorder 50kg coffee beans',
      confidenceScore: 0.9,
      evidenceRefs: ['inventory:123'],
      uncertaintyNotes: ['Supplier delivery lead time may vary'],
    });

    expect(contract.conclusion).toBe('Reorder 50kg coffee beans');
    expect(contract.confidenceScore).toBe(0.9);
    expect(contract.isHighConfidence).toBe(true);
    expect(Object.isFrozen(contract)).toBe(true);
  });
});
