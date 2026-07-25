'use strict';

class DeveloperSandboxFixtureService {
  createFakeSsotOrderFixture(overrides = {}) {
    return Object.freeze({
      order_id: 'order_fake_123',
      total_amount: 150000,
      items: [{ sku: 'TEA_001', qty: 2 }],
      created_at: new Date('2026-07-25T10:00:00Z').toISOString(),
      ...overrides,
    });
  }

  createFakeDiscordNotificationFixture(overrides = {}) {
    return Object.freeze({
      channel: 'ceobriefing',
      message: 'Fake brief message for sandbox',
      delivered: true,
      ...overrides,
    });
  }
}

module.exports = DeveloperSandboxFixtureService;
