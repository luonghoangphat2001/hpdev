'use strict';

class ProductOpportunityDetectorService {
  detectOpportunities({ demandSignals = [], minMarginPercent = 40 }) {
    const opportunities = demandSignals
      .filter(s => s.demandScore >= 0.7 && s.estimatedMarginPercent >= minMarginPercent)
      .map(s => Object.freeze({
        productName: s.productName,
        demandScore: s.demandScore,
        estimatedMarginPercent: s.estimatedMarginPercent,
        confidence: 0.85,
      }));

    return Object.freeze({
      opportunities: Object.freeze(opportunities),
      detectedAt: new Date().toISOString(),
    });
  }
}

module.exports = ProductOpportunityDetectorService;
