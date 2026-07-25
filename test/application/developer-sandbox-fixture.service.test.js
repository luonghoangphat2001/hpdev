'use strict';

const DeveloperSandboxFixtureService = require('../../src/application/services/developer-sandbox-fixture.service');

describe('T112: Developer Fixtures/Mocks/Sandbox Service', () => {
  test('generates deterministic test fixtures for sandbox testing', () => {
    const service = new DeveloperSandboxFixtureService();
    const orderFixture = service.createFakeSsotOrderFixture();
    const discordFixture = service.createFakeDiscordNotificationFixture();

    expect(orderFixture.order_id).toBe('order_fake_123');
    expect(discordFixture.channel).toBe('ceobriefing');
  });
});
