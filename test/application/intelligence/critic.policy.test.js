'use strict';

const CriticPolicy = require('@policy/permissions/critic.policy');

describe('T176: Conditional Critic Policy Service', () => {
  test('skips critic for low risk with high confidence and runs for high risk', () => {
    const service = new CriticPolicy({});
    const skip = service.shouldRunCritic({ risk: 'LOW', confidence: 0.95, evidenceProvided: true, isReversible: true });
    expect(skip.shouldRunCritic).toBe(false);

    const run = service.shouldRunCritic({ risk: 'HIGH', confidence: 0.95, evidenceProvided: true, isReversible: false });
    expect(run.shouldRunCritic).toBe(true);
  });
});
