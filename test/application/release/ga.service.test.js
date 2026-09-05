'use strict';

const GaRolloutService = require('@services/release/deploy/ga-rollout.service');

describe('T200: Progressive GA Completion — Final Milestone Gate', () => {
  test('validates all 200 tasks milestones deployed, flags/policies stable, and CEO sign-off for GA release', () => {
    const service = new GaRolloutService({});

    const ga = service.performGaReadinessCheck({ ceoSignedOff: true });

    expect(ga.gaReleaseApproved).toBe(true);
    expect(ga.allMilestonesPassed).toBe(true);
    expect(ga.featureFlagsStable).toBe(true);
    expect(ga.policiesStable).toBe(true);
    expect(ga.ceoSignedOff).toBe(true);
    expect(ga.totalTasksCompleted).toBe(200);
  });

  test('blocks GA release when CEO has not signed off', () => {
    const service = new GaRolloutService({});

    const blocked = service.performGaReadinessCheck({ ceoSignedOff: false });
    expect(blocked.gaReleaseApproved).toBe(false);
  });
});
