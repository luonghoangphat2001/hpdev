'use strict';

const AutoApproveShadowCanaryKillswitchService = require('../../src/application/services/auto-approve-shadow-canary-killswitch.service');

describe('T196: Auto-Approve Shadow/Canary/Kill-Switch Service', () => {
  test('evaluates shadow "would approve" state and supports instant kill-switch disable', () => {
    const service = new AutoApproveShadowCanaryKillswitchService({});
    
    const shadow = service.evaluateShadowCanary({ actionType: 'PO_CREATE', amount: 300 });
    expect(shadow.shadowMode).toBe(true);
    expect(shadow.wouldApprove).toBe(true);

    service.toggleKillswitch(true);
    const killed = service.evaluateShadowCanary({ actionType: 'PO_CREATE', amount: 300 });
    expect(killed.killswitchActive).toBe(true);
    expect(killed.wouldApprove).toBe(false);
  });
});
