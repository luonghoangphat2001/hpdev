'use strict';

class AutoApproveShadowCanaryKillswitchService {
  constructor({ precedenceEngineService }) {
    this.precedenceEngineService = precedenceEngineService;
    this.killswitchActive = false;
  }

  evaluateShadowCanary({ actionType, amount }) {
    if (this.killswitchActive) {
      return Object.freeze({
        shadowMode: false,
        wouldApprove: false,
        killswitchActive: true,
        reason: 'Auto-approve disabled via kill-switch',
      });
    }

    return Object.freeze({
      shadowMode: true,
      wouldApprove: amount <= 500,
      killswitchActive: false,
      evaluatedAt: new Date().toISOString(),
    });
  }

  toggleKillswitch(active = true) {
    this.killswitchActive = active;
    return Object.freeze({ killswitchActive: this.killswitchActive });
  }
}

module.exports = AutoApproveShadowCanaryKillswitchService;
