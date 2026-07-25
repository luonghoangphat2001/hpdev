'use strict';

const ExperimentFrameworkService = require('../../src/application/services/experiment-framework.service');

describe('T102: Experiment/A-B Proposal Framework Service', () => {
  test('creates structured experiment proposal with guardrails', () => {
    const service = new ExperimentFrameworkService();
    const proposal = service.createExperimentProposal({
      hypothesis: '10% price discount on Milk Tea increases conversion by 15%',
      targetMetric: 'conversion_rate',
      guardrailMetric: 'gross_margin',
      stopCondition: 'gross_margin_drop > 5%',
    });

    expect(proposal.status).toBe('PROPOSED');
    expect(proposal.guardrailMetric).toBe('gross_margin');
  });
});
