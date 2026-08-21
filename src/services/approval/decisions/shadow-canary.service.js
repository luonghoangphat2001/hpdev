/**
 * @fileoverview shadow-canary.service - Provides shadow-canary functionality.
 */
'use strict';

/**
 * ShadowCanaryService
 * Manages shadow canary logic.
 */
class ShadowCanaryService {
  /**
   * constructor - Executes constructor.
   * @param {*} precedenceEngineService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ precedenceEngineService }) {
    this.precedenceEngineService = precedenceEngineService;
    this.killswitchActive = false;
  }

  /**
   * evaluateShadowCanary - Executes evaluate shadow canary.
   * @param {*} actionType - Input parameter.
   * @param {*} amount - Input parameter.
   * @returns {*} Result of operation.
   */
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

  /**
   * toggleKillswitch - Executes toggle killswitch.
   * @param {*} active - Input parameter.
   * @returns {*} Result of operation.
   */
  toggleKillswitch(active = true) {
    this.killswitchActive = active;
    return Object.freeze({ killswitchActive: this.killswitchActive });
  }
}

module.exports = ShadowCanaryService;
