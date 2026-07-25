'use strict';

class CompetitorResearchWorkflowService {
  executeResearch({ competitorName = '', maxBudgetUSD = 1.0 }) {
    return Object.freeze({
      competitorName,
      source: 'PUBLIC_PROMOTION_CATALOG',
      freshness: new Date().toISOString(),
      costBudgetUSD: maxBudgetUSD,
      legalBoundaryCompliant: true,
      findings: [`Competitor ${competitorName} is running Buy 1 Get 1 promo`],
    });
  }
}

module.exports = CompetitorResearchWorkflowService;
