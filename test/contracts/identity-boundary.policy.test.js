'use strict';

const identityPolicy = require('../../src/contracts/security/identity-boundary.policy');
const {
  IdentityBoundaryPolicy,
  SYSTEM_IDENTITIES,
  TRUST_FLOWS,
} = require('../../src/contracts/security/identity-boundary.policy');

describe('IdentityBoundaryPolicy', () => {
  it('keeps Ecommerce as the only business-state writer', () => {
    expect(identityPolicy.canWriteBusinessState('ecommerce')).toBe(true);
    expect(identityPolicy.canWriteBusinessState('openclaw')).toBe(false);
    expect(identityPolicy.canWriteBusinessState('dan_ai')).toBe(false);
    expect(identityPolicy.canWriteBusinessState('unknown')).toBe(false);
  });

  it('requires explicit CEO Discord identity, guild and channel', () => {
    expect(identityPolicy.getFlow('ceo_to_dan_ai').requiredConfig).toEqual([
      'CEO_DISCORD_USER_ID',
      'DISCORD_GUILD_ID',
      'CEO_DISCORD_CHANNEL_ID',
    ]);
  });

  it('assigns the Discord token only to dan_ai', () => {
    expect(identityPolicy.getSecret('discord_bot_token')).toMatchObject({
      issuer: 'discord',
      holders: ['dan_ai'],
      danAiEnv: 'DISCORD_TOKEN',
    });
  });

  it('defines authenticated trust flows in both integration directions', () => {
    expect(identityPolicy.getFlow('ecommerce_to_openclaw').authentication)
      .toBe('hmac_sha256');
    expect(identityPolicy.getFlow('openclaw_to_ecommerce').authentication)
      .toBe('agent_bearer_and_code');
    expect(identityPolicy.getFlow('openclaw_to_dan_ai').credential)
      .toBe('dan_ai_api_secret');
  });

  it('contains only environment variable names, not secret values', () => {
    const serialized = JSON.stringify(identityPolicy.secrets);
    expect(serialized).not.toMatch(/your_|change-me|Bearer [A-Za-z0-9]/i);
  });

  it('rejects unknown systems and credentials at startup', () => {
    expect(() => new IdentityBoundaryPolicy({
      systems: SYSTEM_IDENTITIES,
      secrets: [],
      flows: TRUST_FLOWS,
    })).toThrow('Unknown credential');

    expect(() => new IdentityBoundaryPolicy({
      systems: SYSTEM_IDENTITIES,
      secrets: identityPolicy.secrets,
      flows: [{ name: 'invalid', caller: 'ghost', callee: 'openclaw' }],
    })).toThrow('Unknown trust boundary');
  });
});
