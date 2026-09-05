'use strict';

const actionCatalog = require('@schemas/workflow/action.catalog');
const {
  EcommerceActionCatalog,
  ACTION_CATALOG_VERSION,
} = require('@schemas/workflow/action.catalog');

describe('EcommerceActionCatalog', () => {
  it('defines endpoint, method, permission and receipt for every action', () => {
    actionCatalog.list().forEach((action) => {
      expect(action).toMatchObject({
        name: expect.any(String),
        method: expect.stringMatching(/^(GET|POST|PUT|PATCH|DELETE)$/),
        endpoint: expect.stringMatching(/^\/api\/v1\/storefront\/agents\//),
        permission: expect.any(String),
        receipt: {
          type: expect.any(String),
          successStatuses: expect.any(Array),
          requiredFields: expect.any(Array),
        },
        availability: 'planned',
        catalogVersion: ACTION_CATALOG_VERSION,
      });
    });
  });

  it('requires an auditable receipt for every write action', () => {
    const writes = actionCatalog.list().filter(({ method }) => method !== 'GET');

    writes.forEach(({ receipt }) => {
      expect(receipt.type).toBe('action_receipt');
      expect(receipt.requiredFields).toEqual(expect.arrayContaining([
        'action_id',
        'idempotency_key',
        'status',
        'resource_version',
      ]));
    });
  });

  it('supports permission-based allowlist lookup', () => {
    expect(actionCatalog.listByPermission('order.read').map(({ name }) => name))
      .toEqual(['order.list', 'order.read']);
    expect(actionCatalog.listByPermission('not.granted')).toEqual([]);
  });

  it('rejects incomplete and duplicate definitions', () => {
    expect(() => new EcommerceActionCatalog([{ name: 'invalid' }]))
      .toThrow('missing required field');

    const action = actionCatalog.get('order.read');
    expect(() => new EcommerceActionCatalog([action, action]))
      .toThrow('Duplicate action definition: order.read');
  });

  it('does not expose an unknown action', () => {
    expect(actionCatalog.has('database.raw.execute')).toBe(false);
    expect(actionCatalog.get('database.raw.execute')).toBeNull();
  });
});
