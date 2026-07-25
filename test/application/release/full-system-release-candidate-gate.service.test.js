'use strict';

const FullSystemReleaseCandidateGateService = require('../../../src/application/services/release/full-system-release-candidate-gate.service');

describe('T170: Full-System Release-Candidate Gate Service', () => {
  test('verifies staging release candidate passes gate without enabling production', () => {
    const service = new FullSystemReleaseCandidateGateService({});
    const res = service.evaluateReleaseCandidateGate();

    expect(res.environment).toBe('STAGING');
    expect(res.allFeaturesFunctional).toBe(true);
    expect(res.productionEnabled).toBe(false);
    expect(res.gatePassed).toBe(true);
  });
});
