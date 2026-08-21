'use strict';

const CandidateGateService = require('../../../src/services/release/deploy/candidate-gate.service');

describe('T170: Full-System Release-Candidate Gate Service', () => {
  test('verifies staging release candidate passes gate without enabling production', () => {
    const service = new CandidateGateService({});
    const res = service.evaluateReleaseCandidateGate();

    expect(res.environment).toBe('STAGING');
    expect(res.allFeaturesFunctional).toBe(true);
    expect(res.productionEnabled).toBe(false);
    expect(res.gatePassed).toBe(true);
  });
});
