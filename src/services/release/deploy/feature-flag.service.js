/**
 * @fileoverview feature-flag.service - Provides feature-flag functionality.
 */
'use strict';

/**
 * FeatureFlagService
 * Manages feature flag logic.
 */
class FeatureFlagService {
  /**
   * constructor - Executes constructor.
   * @returns {*} Result of operation.
   */
  constructor() {
    this.flags = new Map();
    this.killSwitchActive = false;
  }

  /**
   * setFlag - Executes set flag.
   * @param {*} key - Input parameter.
   * @param {*} value - Input parameter.
   * @returns {*} Result of operation.
   */
  setFlag(key, value) {
    this.flags.set(key, value);
  }

  /**
   * triggerKillSwitch - Executes trigger kill switch.
   * @returns {*} Result of operation.
   */
  triggerKillSwitch() {
    this.killSwitchActive = true;
  }

  /**
   * isFeatureEnabled - Executes is feature enabled.
   * @param {*} key - Input parameter.
   * @param {*} scope - Input parameter.
   * @returns {*} Result of operation.
   */
  isFeatureEnabled(key, scope = {}) {
    if (this.killSwitchActive) return false;
    if (!this.flags.has(key)) return false;
    return Boolean(this.flags.get(key));
  }
}

module.exports = FeatureFlagService;
