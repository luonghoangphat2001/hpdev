/**
 * @fileoverview ssot-read.adapter - Provides ssot-read functionality.
 */
'use strict';

const actionCatalog = require('../../../schemas/workflow/action.catalog');
const ActionValidatorService = require('../../workflow/action/action-validator.service');
const AppError = require('../../../utils/errors/app.error');

/**
 * SsotReadAdapter
 * Manages ssot read adapter logic.
 */
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

  /**
   * listOrders - Executes list orders.
   * @param {*} query - Input parameter.
   * @returns {*} Result of operation.
   */
  listOrders(query = {}) {
    return this.execute('order.list', query);
  }

  /**
   * getOrder - Executes get order.
   * @param {*} orderId - Input parameter.
   * @returns {*} Result of operation.
   */
  getOrder(orderId) {
    return this.execute('order.read', { order_id: orderId });
  }

  /**
   * listProducts - Executes list products.
   * @param {*} query - Input parameter.
   * @returns {*} Result of operation.
   */
  listProducts(query = {}) {
    return this.execute('product.list', query);
  }

  /**
   * getProduct - Executes get product.
   * @param {*} productId - Input parameter.
   * @returns {*} Result of operation.
   */
  getProduct(productId) {
    return this.execute('product.read', { product_id: productId });
  }

  /**
   * getInventory - Executes get inventory.
   * @param {*} productId - Input parameter.
   * @returns {*} Result of operation.
   */
  getInventory(productId) {
    return this.execute('inventory.read', { product_id: productId });
  }

  /**
   * getFinanceSummary - Executes get finance summary.
   * @param {*} period - Input parameter.
   * @returns {*} Result of operation.
   */
  getFinanceSummary(period) {
    return this.execute('finance.summary.read', { period });
  }

  /**
   * listCustomerFeedback - Executes list customer feedback.
   * @param {*} query - Input parameter.
   * @returns {*} Result of operation.
   */
  listCustomerFeedback(query = {}) {
    return this.execute('cskh.feedback.list', query);
  }

  /**
   * execute - Asynchronously executes execute.
   * @param {*} actionName - Input parameter.
   * @param {*} payload - Input parameter.
   * @returns {*} Promise resolving result.
   */
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

  /**
   * resolveRequest - Executes resolve request.
   * @param {*} endpoint - Input parameter.
   * @param {*} payload - Input parameter.
   * @returns {*} Result of operation.
   */
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
