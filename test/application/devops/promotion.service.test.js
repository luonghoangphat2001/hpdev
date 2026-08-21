'use strict';

const VersionPromotionService = require('../../../src/services/release/rollback/version-promotion.service');

describe('T159: Version Promotion and Instant Rollback Service', () => {
  test('promotes version atomically and rolls back to known-good version', () => {
    const service = new VersionPromotionService({});
    const promo = service.promoteVersion({ agentId: 'dan_ops', version: 'v2.0.0' });
    const rollback = service.rollbackToKnownGood({ agentId: 'dan_ops', rollbackRef: 'v1.9.9' });

    expect(promo.status).toBe('PROMOTED_ATOMIC');
    expect(rollback.status).toBe('ROLLED_BACK_SUCCESS');
    expect(rollback.rolledBackTo).toBe('v1.9.9');
  });
});
