'use strict';

const eventCatalog = require('../../src/contracts/events/ecommerce-event.catalog');
const actionCatalog = require('../../src/contracts/actions/ecommerce-action.catalog');
const registry = require('../../src/domain/agents/agent-registry');
const { AgentRegistry } = require('../../src/domain/agents/agent-registry');

describe('AgentRegistry', () => {
  it('registers exactly the five company agents', () => {
    expect(registry.list().map(({ id }) => id)).toEqual([
      'dan_rnd',
      'dan_logistics',
      'dan_cfo',
      'dan_ops',
      'dan_cskh',
    ]);
  });

  it('routes every current Ecommerce event to at least one agent', () => {
    eventCatalog.list().forEach(({ name }) => {
      const decision = registry.routeEvent(name);
      expect(decision.status).toBe('routed');
      expect(decision.agents.length).toBeGreaterThan(0);
    });
  });

  it('routes every write action to its owning department agent', () => {
    const expected = {
      'inventory.purchase_order_draft.create': 'dan_logistics',
      'finance.refund.execute': 'dan_cfo',
      'ops.order_status.update': 'dan_ops',
      'cskh.response.send': 'dan_cskh',
      'cskh.voucher.issue': 'dan_cskh',
    };

    actionCatalog.list()
      .filter(({ method }) => method !== 'GET')
      .forEach(({ name }) => {
        expect(registry.routeAction(name).agents).toContain(expected[name]);
      });
  });

  it('has an explicit route for every allowlisted SSOT action', () => {
    actionCatalog.list().forEach(({ name }) => {
      expect(registry.routeAction(name).status).toBe('routed');
    });
  });

  it('sends unknown events and actions to dead-letter', () => {
    expect(registry.routeEvent('unknown.created')).toMatchObject({
      status: 'dead_letter',
      reason: 'unknown_route',
      agents: [],
    });
    expect(registry.routeAction('database.raw.execute').status).toBe('dead_letter');
  });

  it('deduplicates agents when exact and wildcard routes both match', () => {
    expect(registry.routeEvent('order.created').agents).toEqual([
      'dan_ops',
      'dan_cfo',
    ]);
  });

  it('rejects routes that reference an unregistered agent', () => {
    expect(() => new AgentRegistry({
      agents: registry.list(),
      eventRoutes: [{ pattern: 'order.*', agents: ['dan_ghost'] }],
      actionRoutes: [],
    })).toThrow('Route references unknown agent: dan_ghost');
  });
});
