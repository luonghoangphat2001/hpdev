'use strict';

const MemoryPolicy = require('../../src/policy/permissions/memory-policy');
const { SCOPE_TTL_MS } = require('../../src/policy/permissions/memory-policy');

describe('MemoryPolicy', () => {
  test('redacts PII and secrets before creating scoped memory', () => {
    const policy = new MemoryPolicy({
      clock: () => new Date('2026-07-25T08:00:00Z'),
      idFactory: () => 'mem_1',
    });

    const memory = policy.create({
      agentId: 'dan_cskh',
      scopeType: 'customer',
      scopeId: 'customer-1',
      key: 'recovery_preference',
      value: {
        preference: 'Call 0901234567 or test@example.com',
        accessToken: 'raw-secret',
      },
      sourceRef: 'feedback:1',
    });

    expect(memory.value).toEqual({
      preference: 'Call [REDACTED_PHONE] or [REDACTED_EMAIL]',
      accessToken: '[REDACTED]',
    });
    expect(memory.expiresAt.getTime() - memory.createdAt.getTime())
      .toBe(SCOPE_TTL_MS.customer);
  });

  test('enforces maximum TTL by scope', () => {
    const policy = new MemoryPolicy();
    expect(() => policy.create({
      agentId: 'dan_ops',
      scopeType: 'workflow',
      scopeId: 'wfl_1',
      key: 'x',
      value: {},
      sourceRef: 'event:1',
      ttlMs: SCOPE_TTL_MS.workflow + 1,
    })).toThrow('TTL exceeds policy');
  });

  test('only exposes non-expired memory in the requested agent scope', () => {
    const policy = new MemoryPolicy();
    const base = {
      agent_id: 'dan_cfo',
      scope_type: 'workflow',
      scope_id: 'wfl_1',
      expires_at: '2026-07-26T00:00:00Z',
    };
    const request = {
      agentId: 'dan_cfo',
      scopes: [{ type: 'workflow', id: 'wfl_1' }],
      at: new Date('2026-07-25T00:00:00Z'),
    };

    expect(policy.isUsable(base, request)).toBe(true);
    expect(policy.isUsable({ ...base, agent_id: 'dan_ops' }, request)).toBe(false);
    expect(policy.isUsable({ ...base, expires_at: '2026-07-24T00:00:00Z' }, request))
      .toBe(false);
  });
});
