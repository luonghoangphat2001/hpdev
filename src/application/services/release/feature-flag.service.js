'use strict';

class FeatureFlagService {
  constructor() {
    this.flags = new Map();
    this.killSwitchActive = false;
  }

  setFlag(key, value) {
    this.flags.set(key, value);
  }

  triggerKillSwitch() {
    this.killSwitchActive = true;
  }

  isFeatureEnabled(key, scope = {}) {
    if (this.killSwitchActive) return false;
    if (!this.flags.has(key)) return false;
    return Boolean(this.flags.get(key));
  }
}

module.exports = FeatureFlagService;
