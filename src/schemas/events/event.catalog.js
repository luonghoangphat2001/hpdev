/**
 * @fileoverview event.catalog - Provides event functionality.
 */
'use strict';

const EVENT_CATALOG_VERSION = '1.0.0';
const EVENT_ENVELOPE_FIELDS = Object.freeze([
  'webhook_id',
  'event',
  'timestamp',
  'data',
  'changes',
]);

const ECOMMERCE_EVENT_SOURCES = Object.freeze([
  Object.freeze({
    aggregate: 'order',
    topic: 'order',
    producerModel: 'App\\Models\\Order',
    actions: Object.freeze(['created', 'updated', 'deleted', 'restored']),
  }),
  Object.freeze({
    aggregate: 'product',
    topic: 'product',
    producerModel: 'App\\Models\\Product',
    actions: Object.freeze(['created', 'updated', 'deleted', 'restored']),
  }),
  Object.freeze({
    aggregate: 'product_category',
    topic: 'productcategory',
    producerModel: 'App\\Models\\ProductCategory',
    actions: Object.freeze(['created', 'updated', 'deleted']),
  }),
]);

/**
 * EcommerceEventCatalog
 * Manages ecommerce event catalog logic.
 */
class EcommerceEventCatalog {
  /**
   * constructor - Executes constructor.
   * @param {*} sources - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(sources = ECOMMERCE_EVENT_SOURCES) {
    this.events = new Map();

    sources.forEach((source) => {
      source.actions.forEach((action) => {
        const name = `${source.topic}.${action}`;
        this.events.set(name, Object.freeze({
          name,
          aggregate: source.aggregate,
          action,
          producerModel: source.producerModel,
          catalogVersion: EVENT_CATALOG_VERSION,
        }));
      });
    });
  }

  /**
   * has - Executes has.
   * @param {*} eventName - Input parameter.
   * @returns {*} Result of operation.
   */
  has(eventName) {
    return this.events.has(eventName);
  }

  /**
   * get - Executes get.
   * @param {*} eventName - Input parameter.
   * @returns {*} Result of operation.
   */
  get(eventName) {
    return this.events.get(eventName) || null;
  }

  /**
   * list - Executes list.
   * @returns {*} Result of operation.
   */
  list() {
    return Array.from(this.events.values());
  }
}

module.exports = new EcommerceEventCatalog();
module.exports.EcommerceEventCatalog = EcommerceEventCatalog;
module.exports.ECOMMERCE_EVENT_SOURCES = ECOMMERCE_EVENT_SOURCES;
module.exports.EVENT_CATALOG_VERSION = EVENT_CATALOG_VERSION;
module.exports.EVENT_ENVELOPE_FIELDS = EVENT_ENVELOPE_FIELDS;
