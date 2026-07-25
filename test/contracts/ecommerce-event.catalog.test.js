'use strict';

const eventCatalog = require('../../src/contracts/events/ecommerce-event.catalog');
const {
  EcommerceEventCatalog,
  EVENT_CATALOG_VERSION,
  EVENT_ENVELOPE_FIELDS,
} = require('../../src/contracts/events/ecommerce-event.catalog');

describe('EcommerceEventCatalog', () => {
  it('contains every event currently emitted by Ecommerce webhook models', () => {
    expect(eventCatalog.list().map(({ name }) => name)).toEqual([
      'order.created',
      'order.updated',
      'order.deleted',
      'order.restored',
      'product.created',
      'product.updated',
      'product.deleted',
      'product.restored',
      'productcategory.created',
      'productcategory.updated',
      'productcategory.deleted',
    ]);
  });

  it('returns immutable event metadata', () => {
    const event = eventCatalog.get('order.created');

    expect(event).toEqual({
      name: 'order.created',
      aggregate: 'order',
      action: 'created',
      producerModel: 'App\\Models\\Order',
      catalogVersion: EVENT_CATALOG_VERSION,
    });
    expect(Object.isFrozen(event)).toBe(true);
  });

  it('does not claim advertised events that have no runtime producer', () => {
    expect(eventCatalog.has('category.created')).toBe(false);
    expect(eventCatalog.has('user.created')).toBe(false);
    expect(eventCatalog.get('unknown.event')).toBeNull();
  });

  it('supports extension through injected source definitions', () => {
    const catalog = new EcommerceEventCatalog([
      {
        aggregate: 'inventory',
        topic: 'inventory',
        producerModel: 'App\\Models\\Inventory',
        actions: ['adjusted'],
      },
    ]);

    expect(catalog.get('inventory.adjusted')).toMatchObject({
      aggregate: 'inventory',
      action: 'adjusted',
    });
  });

  it('documents the current Ecommerce webhook envelope', () => {
    expect(EVENT_ENVELOPE_FIELDS).toEqual([
      'webhook_id',
      'event',
      'timestamp',
      'data',
      'changes',
    ]);
  });
});
