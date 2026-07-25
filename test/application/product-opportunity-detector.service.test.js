'use strict';

const ProductOpportunityDetectorService = require('../../src/application/services/product-opportunity-detector.service');

describe('T101: Product/Menu Opportunity Detector Service', () => {
  test('detects high-demand high-margin menu opportunities', () => {
    const service = new ProductOpportunityDetectorService();
    const result = service.detectOpportunities({
      demandSignals: [
        { productName: 'Matcha Latte', demandScore: 0.85, estimatedMarginPercent: 50 },
        { productName: 'Plain Black Tea', demandScore: 0.4, estimatedMarginPercent: 60 },
      ],
      minMarginPercent: 40,
    });

    expect(result.opportunities.length).toBe(1);
    expect(result.opportunities[0].productName).toBe('Matcha Latte');
  });
});
