'use strict';

const CapabilityRegistry = require('../../src/domain/capabilities/capability-registry');
const {
  buildCapabilityRegistry,
} = require('../../src/composition/capability-registry.composition');

describe('CapabilityRegistry', () => {
  test('queries versioned agents, tools, and model profiles', () => {
    const registry = buildCapabilityRegistry();

    expect(registry.query({ kind: 'agent' })).toHaveLength(5);
    expect(registry.query({ kind: 'model' }).map(({ id }) => id))
      .toEqual(['fast', 'reasoning']);
    expect(registry.get('agent', 'dan_cfo')).toMatchObject({
      version: '1.0.0',
      capabilities: expect.arrayContaining(['reconciliation']),
      permissions: expect.arrayContaining(['refund.execute']),
    });
    expect(registry.get('tool', 'finance.refund.execute')).toMatchObject({
      available: false,
      permissions: ['refund.execute'],
      metadata: { availability: 'planned' },
    });
  });

  test('filters candidates by capability, permission, and availability', () => {
    const registry = buildCapabilityRegistry();

    expect(registry.query({
      kind: 'agent',
      capability: 'sla_monitoring',
      permission: 'order_status.update',
      available: true,
    }).map(({ id }) => id)).toEqual(['dan_ops']);
    expect(registry.query({ kind: 'tool', available: true })).toEqual([]);
  });

  test('rejects duplicate or incomplete registrations', () => {
    const entry = {
      kind: 'agent',
      id: 'dan_test',
      version: '1.0.0',
      capabilities: [],
      permissions: [],
    };
    expect(() => new CapabilityRegistry([entry, entry]))
      .toThrow('Duplicate capability entry');
    expect(() => new CapabilityRegistry([{ kind: 'unknown', id: 'x', version: '1' }]))
      .toThrow('valid kind');
  });
});
