'use strict';

const OptimizationAcceptanceGateService = require('../../../src/application/services/release/optimization-acceptance-gate.service');

describe('T189: Optimization Acceptance Gate Service', () => {
  test('evaluates optimization gate requiring SLO/cost/quality and CEO sign-off without compromising high-risk safety', () => {
    const service = new OptimizationAcceptanceGateService({});
    const gate = service.evaluateAcceptanceGate({ ceoSignedOff: true });

    expect(gate.gatePassed).toBe(true);
    expect(gate.highRiskSafetyCompromised).toBe(false);
    expect(gate.sloMet).toBe(true);
  });
});
