/**
 * @fileoverview action.catalog - Provides action functionality.
 */
'use strict';

const ACTION_CATALOG_VERSION = '1.0.0';
const AGENT_API_PREFIX = '/api/v1/storefront/agents';
const REQUIRED_ACTION_FIELDS = Object.freeze([
  'name',
  'method',
  'endpoint',
  'permission',
  'receipt',
]);

const READ_RECEIPT = Object.freeze({
  type: 'resource',
  successStatuses: Object.freeze([200]),
  requiredFields: Object.freeze(['data']),
});

const WRITE_RECEIPT = Object.freeze({
  type: 'action_receipt',
  successStatuses: Object.freeze([200, 201, 202]),
  requiredFields: Object.freeze([
    'action_id',
    'idempotency_key',
    'status',
    'resource_type',
    'resource_id',
    'resource_version',
    'executed_at',
  ]),
});

function defineAction({
  name,
  method,
  endpoint,
  permission,
  receipt,
  availability = 'planned',
}) {
  return Object.freeze({
    name,
    method,
    endpoint: `${AGENT_API_PREFIX}${endpoint}`,
    permission,
    receipt,
    availability,
    catalogVersion: ACTION_CATALOG_VERSION,
  });
}

const ECOMMERCE_ACTIONS = Object.freeze([
  defineAction({
    name: 'order.list',
    method: 'GET',
    endpoint: '/orders',
    permission: 'order.read',
    receipt: READ_RECEIPT,
  }),
  defineAction({
    name: 'order.read',
    method: 'GET',
    endpoint: '/orders/{order_id}',
    permission: 'order.read',
    receipt: READ_RECEIPT,
  }),
  defineAction({
    name: 'product.list',
    method: 'GET',
    endpoint: '/products',
    permission: 'product.read',
    receipt: READ_RECEIPT,
  }),
  defineAction({
    name: 'product.read',
    method: 'GET',
    endpoint: '/products/{product_id}',
    permission: 'product.read',
    receipt: READ_RECEIPT,
  }),
  defineAction({
    name: 'inventory.read',
    method: 'GET',
    endpoint: '/inventory/{product_id}',
    permission: 'inventory.read',
    receipt: READ_RECEIPT,
  }),
  defineAction({
    name: 'finance.summary.read',
    method: 'GET',
    endpoint: '/finance/summary',
    permission: 'finance.read',
    receipt: READ_RECEIPT,
  }),
  defineAction({
    name: 'cskh.feedback.list',
    method: 'GET',
    endpoint: '/customer-feedback',
    permission: 'cskh.read',
    receipt: READ_RECEIPT,
  }),
  defineAction({
    name: 'inventory.purchase_order_draft.create',
    method: 'POST',
    endpoint: '/purchase-orders/drafts',
    permission: 'purchase_order_draft.create',
    receipt: WRITE_RECEIPT,
  }),
  defineAction({
    name: 'finance.refund.execute',
    method: 'POST',
    endpoint: '/orders/{order_id}/refunds',
    permission: 'refund.execute',
    receipt: WRITE_RECEIPT,
  }),
  defineAction({
    name: 'ops.order_status.update',
    method: 'POST',
    endpoint: '/orders/{order_id}/status',
    permission: 'order_status.update',
    receipt: WRITE_RECEIPT,
  }),
  defineAction({
    name: 'cskh.response.send',
    method: 'POST',
    endpoint: '/customer-feedback/{feedback_id}/responses',
    permission: 'cskh_response.send',
    receipt: WRITE_RECEIPT,
  }),
  defineAction({
    name: 'cskh.voucher.issue',
    method: 'POST',
    endpoint: '/customers/{customer_id}/vouchers',
    permission: 'voucher.issue',
    receipt: WRITE_RECEIPT,
  }),
]);

/**
 * EcommerceActionCatalog
 * Manages ecommerce action catalog logic.
 */
class EcommerceActionCatalog {
  /**
   * constructor - Executes constructor.
   * @param {*} actions - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(actions = ECOMMERCE_ACTIONS) {
    this.actions = new Map();

    actions.forEach((action) => this.register(action));
  }

  /**
   * register - Executes register.
   * @param {*} action - Input parameter.
   * @returns {*} Result of operation.
   */
  register(action) {
    const missingField = REQUIRED_ACTION_FIELDS.find((field) => !action[field]);
    if (missingField) {
      throw new TypeError(`Action definition is missing required field: ${missingField}`);
    }

    if (this.actions.has(action.name)) {
      throw new TypeError(`Duplicate action definition: ${action.name}`);
    }

    this.actions.set(action.name, Object.freeze({ ...action }));
  }

  /**
   * has - Executes has.
   * @param {*} actionName - Input parameter.
   * @returns {*} Result of operation.
   */
  has(actionName) {
    return this.actions.has(actionName);
  }

  /**
   * get - Executes get.
   * @param {*} actionName - Input parameter.
   * @returns {*} Result of operation.
   */
  get(actionName) {
    return this.actions.get(actionName) || null;
  }

  /**
   * list - Executes list.
   * @returns {*} Result of operation.
   */
  list() {
    return Array.from(this.actions.values());
  }

  /**
   * listByPermission - Executes list by permission.
   * @param {*} permission - Input parameter.
   * @returns {*} Result of operation.
   */
  listByPermission(permission) {
    return this.list().filter((action) => action.permission === permission);
  }
}

module.exports = new EcommerceActionCatalog();
module.exports.EcommerceActionCatalog = EcommerceActionCatalog;
module.exports.ECOMMERCE_ACTIONS = ECOMMERCE_ACTIONS;
module.exports.ACTION_CATALOG_VERSION = ACTION_CATALOG_VERSION;
module.exports.AGENT_API_PREFIX = AGENT_API_PREFIX;
module.exports.READ_RECEIPT = READ_RECEIPT;
module.exports.WRITE_RECEIPT = WRITE_RECEIPT;
