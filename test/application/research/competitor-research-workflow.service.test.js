'use strict';

const CompetitorResearchWorkflowService = require('../../../src/application/services/research/competitor-research-workflow.service');

describe('T103: Competitor/Market Research Workflow Service', () => {
  test('executes compliant competitor research within cost budget', () => {
    const service = new CompetitorResearchWorkflowService();
    const result = service.executeResearch({ competitorName: 'Brand X', maxBudgetUSD: 0.5 });

    expect(result.legalBoundaryCompliant).toBe(true);
    expect(result.costBudgetUSD).toBe(0.5);
    expect(result.findings.length).toBeGreaterThan(0);
  });
});
