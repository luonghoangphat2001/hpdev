'use strict';

const ConditionalCriticPolicyService = require('../../src/application/services/conditional-critic-policy.service');

describe('T176: Conditional Critic Policy Service', () => {
  test('skips critic for low risk with high confidence and runs for high risk', () => {
    const service = new ConditionalCriticPolicyService({});
    const skip = service.shouldRunCritic({ risk: 'LOW', confidence: 0.95, evidenceProvided: true, isReversible: true });
    expect(skip.shouldRunCritic).toBe(false);

    const run = service.shouldRunCritic({ risk: 'HIGH', confidence: 0.95, evidenceProvided: true, isReversible: false });
    expect(run.shouldRunCritic).toBe(true);
  });
});
