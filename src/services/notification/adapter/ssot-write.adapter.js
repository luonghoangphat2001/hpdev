/**
 * @fileoverview ssot-write.adapter - Provides ssot-write functionality.
 */
'use strict';

const actionCatalog = require('../../../schemas/workflow/action.catalog');
const ActionValidatorService = require('../../workflow/action/action-validator.service');
const RiskEvaluator = require('../../../policy/permissions/risk-evaluator');
const AppError = require('../../../utils/errors/app.error');

const POLICY_ONLY_FIELDS = Object.freeze(['confidence']);

/**
 * SsotWriteAdapter
 * Manages ssot write adapter logic.
 */
class SsotWriteAdapter {
  constructor({
    client,
    catalog = actionCatalog,
    validator = new ActionValidatorService(),
    riskEvaluator = new RiskEvaluator(),
    allowPlanned = false,
  }) {
    this.client = client;
    this.catalog = catalog;
    this.validator = validator;
    this.riskEvaluator = riskEvaluator;
    this.allowPlanned = allowPlanned;
  }

  /**
   * createPurchaseOrderDraft - Executes create purchase order draft.
   * @param {*} payload - Input parameter.
   * @param {*} options - Input parameter.
   * @returns {*} Result of operation.
   */
  createPurchaseOrderDraft(payload, options) {
    return this.execute('inventory.purchase_order_draft.create', payload, options);
  }

  /**
   * executeRefund - Executes execute refund.
   * @param {*} payload - Input parameter.
   * @param {*} options - Input parameter.
   * @returns {*} Result of operation.
   */
  executeRefund(payload, options) {
    return this.execute('finance.refund.execute', payload, options);
  }

  /**
   * updateOrderStatus - Executes update order status.
   * @param {*} payload - Input parameter.
   * @param {*} options - Input parameter.
   * @returns {*} Result of operation.
   */
  updateOrderStatus(payload, options) {
    return this.execute('ops.order_status.update', payload, options);
  }

  /**
   * sendCustomerResponse - Executes send customer response.
   * @param {*} payload - Input parameter.
   * @param {*} options - Input parameter.
   * @returns {*} Result of operation.
   */
  sendCustomerResponse(payload, options) {
    return this.execute('cskh.response.send', payload, options);
  }

  /**
   * issueVoucher - Executes issue voucher.
   * @param {*} payload - Input parameter.
   * @param {*} options - Input parameter.
   * @returns {*} Result of operation.
   */
  issueVoucher(payload, options) {
    return this.execute('cskh.voucher.issue', payload, options);
  }

  async execute(actionName, payload, {
    actionId,
    idempotencyKey,
    expectedResourceVersion,
    grantedPermissions = [],
    approval = null,
  } = {}) {
    const { action } = this.validator.validate(actionName, payload);
    if (action.method === 'GET') {
      throw new TypeError(`Write adapter cannot execute read action: ${actionName}`);
    }
    if (action.availability !== 'implemented' && !this.allowPlanned) {
      throw new AppError('SSOT action is not implemented', 503, {
        code: 'ssot_action_unavailable',
        action: actionName,
      });
    }
    if (!/^idem:v1:[a-z0-9._-]+:[a-f0-9]{64}$/.test(idempotencyKey || '')) {
      throw new AppError('Valid idempotency key is required', 422, {
        code: 'idempotency_key_invalid',
      });
    }

    const policy = this.riskEvaluator.evaluate({
      actionName,
      payload,
      grantedPermissions,
    });
    if (policy.decision === 'deny') {
      throw new AppError('Action denied by policy', 403, {
        code: 'action_policy_denied',
        policy,
      });
    }
    if (policy.decision === 'require_approval'
      && (approval?.status !== 'consumed' || approval?.action_id !== actionId)) {
      throw new AppError('Consumed approval is required', 409, {
        code: 'action_approval_required',
        action_id: actionId,
      });
    }

    const { path, body } = this.resolveRequest(action.endpoint, payload);
    const receipt = await this.client.request({
      actionName,
      method: action.method,
      path,
      data: body,
      idempotencyKey,
      ...(expectedResourceVersion ? { expectedResourceVersion } : {}),
    });
    this.assertReceipt(action, receipt, idempotencyKey);
    return Object.freeze(receipt);
  }

  /**
   * resolveRequest - Executes resolve request.
   * @param {*} endpoint - Input parameter.
   * @param {*} payload - Input parameter.
   * @returns {*} Result of operation.
   */
  resolveRequest(endpoint, payload) {
    const body = { ...payload };
    const path = endpoint.replace(/\{([a-z_]+)\}/g, (_match, name) => {
      const value = body[name];
      if (value === undefined) {
        throw new TypeError(`Missing endpoint parameter: ${name}`);
      }
      delete body[name];
      return encodeURIComponent(String(value));
    });
    POLICY_ONLY_FIELDS.forEach((field) => delete body[field]);
    return { path, body };
  }

  /**
   * assertReceipt - Executes assert receipt.
   * @param {*} action - Input parameter.
   * @param {*} receipt - Input parameter.
   * @param {*} expectedIdempotencyKey - Input parameter.
   * @returns {*} Result of operation.
   */
  assertReceipt(action, receipt, expectedIdempotencyKey) {
    const missing = action.receipt.requiredFields
      .filter((field) => receipt?.[field] === undefined);
    if (missing.length > 0) {
      throw new AppError('Invalid SSOT action receipt', 502, {
        code: 'ssot_receipt_invalid',
        missing,
      });
    }
    if (receipt.idempotency_key !== expectedIdempotencyKey) {
      throw new AppError('SSOT receipt idempotency key mismatch', 502, {
        code: 'ssot_receipt_idempotency_mismatch',
      });
    }
  }
}

module.exports = SsotWriteAdapter;
module.exports.POLICY_ONLY_FIELDS = POLICY_ONLY_FIELDS;
