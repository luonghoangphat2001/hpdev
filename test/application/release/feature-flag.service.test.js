'use strict';

const FeatureFlagService = require('../../../src/services/release/deploy/feature-flag.service');

describe('T111: Feature Flag and Config Control Service', () => {
  test('manages scoped flags and respects global kill switch', () => {
    const service = new FeatureFlagService();
    service.setFlag('auto_voucher_creation', true);

    expect(service.isFeatureEnabled('auto_voucher_creation')).toBe(true);

    service.triggerKillSwitch();
    expect(service.isFeatureEnabled('auto_voucher_creation')).toBe(false);
  });
});
