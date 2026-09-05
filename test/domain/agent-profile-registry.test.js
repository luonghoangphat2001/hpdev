'use strict';

const registry = require('@services/ai/agents/agent-profile-registry');
const {
  AgentProfileRegistry,
} = require('@services/ai/agents/agent-profile-registry');

describe('AgentProfileRegistry', () => {
  test('validates complete job descriptions for exactly five company agents', () => {
    expect(registry.list()).toHaveLength(5);
    registry.list().forEach((profile) => {
      expect(profile).toEqual(expect.objectContaining({
        id: expect.stringMatching(/^dan_/),
        version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
        mission: expect.any(String),
        scope: expect.any(Array),
        kpis: expect.any(Array),
        permissions: expect.any(Array),
        prohibitions: expect.any(Array),
        escalationOwner: 'ceo',
      }));
      expect(profile.scope.length).toBeGreaterThan(0);
      expect(profile.kpis.length).toBeGreaterThan(0);
      expect(profile.prohibitions.length).toBeGreaterThan(0);
    });
  });

  test('rejects an incomplete or duplicate profile', () => {
    expect(() => new AgentProfileRegistry({
      profiles: [{ id: 'dan_incomplete' }],
    })).toThrow('Invalid agent profile');
    const profile = registry.get('dan_cfo');
    expect(() => new AgentProfileRegistry({
      profiles: [profile, profile],
    })).toThrow('Duplicate agent profile');
  });
});
