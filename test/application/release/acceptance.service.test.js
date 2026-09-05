'use strict';

const AcceptanceGateService = require('@services/release/deploy/acceptance-gate.service');

describe('T189: Optimization Acceptance Gate Service', () => {
  test('evaluates optimization gate requiring SLO/cost/quality and CEO sign-off without compromising high-risk safety', () => {
    const service = new AcceptanceGateService({});
    const gate = service.evaluateAcceptanceGate({ ceoSignedOff: true });

    expect(gate.gatePassed).toBe(true);
    expect(gate.highRiskSafetyCompromised).toBe(false);
    expect(gate.sloMet).toBe(true);
  });
});
