'use strict';

const ShadowCanaryService = require('@services/approval/decisions/shadow-canary.service');

describe('T196: Auto-Approve Shadow/Canary/Kill-Switch Service', () => {
  test('evaluates shadow "would approve" state and supports instant kill-switch disable', () => {
    const service = new ShadowCanaryService({});
    
    const shadow = service.evaluateShadowCanary({ actionType: 'PO_CREATE', amount: 300 });
    expect(shadow.shadowMode).toBe(true);
    expect(shadow.wouldApprove).toBe(true);

    service.toggleKillswitch(true);
    const killed = service.evaluateShadowCanary({ actionType: 'PO_CREATE', amount: 300 });
    expect(killed.killswitchActive).toBe(true);
    expect(killed.wouldApprove).toBe(false);
  });
});
