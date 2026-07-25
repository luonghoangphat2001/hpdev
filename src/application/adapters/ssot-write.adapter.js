'use strict';

const actionCatalog = require('../../contracts/actions/ecommerce-action.catalog');
const ActionValidatorService = require('../services/action-validator.service');
const RiskEvaluator = require('../../domain/policies/risk-evaluator');
const { AppError } = require('../../middlewares/error.middleware');

const POLICY_ONLY_FIELDS = Object.freeze(['confidence']);

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

  createPurchaseOrderDraft(payload, options) {
    return this.execute('inventory.purchase_order_draft.create', payload, options);
  }

  executeRefund(payload, options) {
    return this.execute('finance.refund.execute', payload, options);
  }

  updateOrderStatus(payload, options) {
    return this.execute('ops.order_status.update', payload, options);
  }

  sendCustomerResponse(payload, options) {
    return this.execute('cskh.response.send', payload, options);
  }

  issueVoucher(payload, options) {
    return this.execute('cskh.voucher.issue', payload, options);
  }

  async execute(actionName, payload, {
    actionId,
    idempotencyKey,
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
    });
    this.assertReceipt(action, receipt, idempotencyKey);
    return Object.freeze(receipt);
  }

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
