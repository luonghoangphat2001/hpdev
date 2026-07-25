'use strict';

const actionCatalog = require('../../contracts/actions/ecommerce-action.catalog');
const ActionValidatorService = require('../services/execution/action-validator.service');
const { AppError } = require('../../middlewares/error.middleware');

class SsotReadAdapter {
  constructor({
    client,
    catalog = actionCatalog,
    validator = new ActionValidatorService(),
    clock = () => new Date(),
    allowPlanned = false,
  }) {
    this.client = client;
    this.catalog = catalog;
    this.validator = validator;
    this.clock = clock;
    this.allowPlanned = allowPlanned;
  }

  listOrders(query = {}) {
    return this.execute('order.list', query);
  }

  getOrder(orderId) {
    return this.execute('order.read', { order_id: orderId });
  }

  listProducts(query = {}) {
    return this.execute('product.list', query);
  }

  getProduct(productId) {
    return this.execute('product.read', { product_id: productId });
  }

  getInventory(productId) {
    return this.execute('inventory.read', { product_id: productId });
  }

  getFinanceSummary(period) {
    return this.execute('finance.summary.read', { period });
  }

  listCustomerFeedback(query = {}) {
    return this.execute('cskh.feedback.list', query);
  }

  async execute(actionName, payload) {
    const { action } = this.validator.validate(actionName, payload);
    if (action.method !== 'GET') {
      throw new TypeError(`Read adapter cannot execute ${action.method} action: ${actionName}`);
    }
    if (action.availability !== 'implemented' && !this.allowPlanned) {
      throw new AppError('SSOT action is not implemented', 503, {
        code: 'ssot_action_unavailable',
        action: actionName,
      });
    }

    const { path, params } = this.resolveRequest(action.endpoint, payload);
    const response = await this.client.request({
      actionName,
      method: action.method,
      path,
      params,
    });

    return Object.freeze({
      schema_version: '1.0.0',
      source: 'ecommerce',
      action: actionName,
      data: response.data ?? response,
      meta: response.meta || {},
      fetched_at: this.clock().toISOString(),
    });
  }

  resolveRequest(endpoint, payload) {
    const params = { ...payload };
    const path = endpoint.replace(/\{([a-z_]+)\}/g, (_match, name) => {
      const value = params[name];
      if (value === undefined) {
        throw new TypeError(`Missing endpoint parameter: ${name}`);
      }
      delete params[name];
      return encodeURIComponent(String(value));
    });
    return { path, params };
  }
}

module.exports = SsotReadAdapter;
