'use strict';

const actionCatalog = require('../actions/ecommerce-action.catalog');

const RESILIENCE_POLICY_VERSION = '1.0.0';

const ERROR_POLICIES = Object.freeze({
  validation_error: Object.freeze({ httpStatus: 400, retryable: false }),
  authentication_failed: Object.freeze({ httpStatus: 401, retryable: false }),
  permission_denied: Object.freeze({ httpStatus: 403, retryable: false }),
  resource_not_found: Object.freeze({ httpStatus: 404, retryable: false }),
  request_conflict: Object.freeze({ httpStatus: 409, retryable: false }),
  business_rule_rejected: Object.freeze({ httpStatus: 422, retryable: false }),
  rate_limited: Object.freeze({ httpStatus: 429, retryable: true }),
  upstream_timeout: Object.freeze({ httpStatus: 504, retryable: true }),
  upstream_unavailable: Object.freeze({ httpStatus: 503, retryable: true }),
  network_error: Object.freeze({ httpStatus: 502, retryable: true }),
  internal_error: Object.freeze({ httpStatus: 500, retryable: false }),
});

const RETRY_PROFILE = Object.freeze({
  maxAttempts: 3,
  backoffMs: Object.freeze([250, 1000, 4000]),
  jitter: true,
  retryableHttpStatuses: Object.freeze([408, 429, 500, 502, 503, 504]),
});

const ACTION_TIMEOUTS_MS = Object.freeze({
  'order.list': 5000,
  'order.read': 5000,
  'product.list': 5000,
  'product.read': 5000,
  'inventory.read': 5000,
  'finance.summary.read': 10000,
  'cskh.feedback.list': 10000,
  'inventory.purchase_order_draft.create': 10000,
  'finance.refund.execute': 15000,
  'ops.order_status.update': 10000,
  'cskh.response.send': 10000,
  'cskh.voucher.issue': 10000,
});

class ErrorRetryPolicy {
  constructor({
    actions = actionCatalog.list(),
    errors = ERROR_POLICIES,
    timeouts = ACTION_TIMEOUTS_MS,
    retryProfile = RETRY_PROFILE,
  } = {}) {
    this.errors = errors;
    this.timeouts = timeouts;
    this.retryProfile = retryProfile;
    this.assertComplete(actions);
  }

  assertComplete(actions) {
    const missing = actions
      .map(({ name }) => name)
      .filter((name) => !Number.isInteger(this.timeouts[name]) || this.timeouts[name] <= 0);

    if (missing.length > 0) {
      throw new TypeError(`Missing action timeout policies: ${missing.join(', ')}`);
    }
  }

  getErrorPolicy(code) {
    return this.errors[code] || Object.freeze({
      httpStatus: 500,
      retryable: false,
      reason: 'unknown_error_code',
    });
  }

  getCallPolicy(actionName) {
    const action = actionCatalog.get(actionName);
    if (!action || !this.timeouts[actionName]) {
      return null;
    }

    return Object.freeze({
      action: actionName,
      timeoutMs: this.timeouts[actionName],
      maxAttempts: this.retryProfile.maxAttempts,
      backoffMs: this.retryProfile.backoffMs,
      jitter: this.retryProfile.jitter,
      retryableHttpStatuses: this.retryProfile.retryableHttpStatuses,
      requiresIdempotencyKeyForRetry: action.method !== 'GET',
      policyVersion: RESILIENCE_POLICY_VERSION,
    });
  }

  canRetry({ errorCode, actionName, attempt, hasIdempotencyKey = false }) {
    const error = this.getErrorPolicy(errorCode);
    const call = this.getCallPolicy(actionName);

    if (!error.retryable || !call || attempt >= call.maxAttempts) {
      return false;
    }

    return !call.requiresIdempotencyKeyForRetry || hasIdempotencyKey;
  }
}

module.exports = new ErrorRetryPolicy();
module.exports.ErrorRetryPolicy = ErrorRetryPolicy;
module.exports.ERROR_POLICIES = ERROR_POLICIES;
module.exports.RETRY_PROFILE = RETRY_PROFILE;
module.exports.ACTION_TIMEOUTS_MS = ACTION_TIMEOUTS_MS;
module.exports.RESILIENCE_POLICY_VERSION = RESILIENCE_POLICY_VERSION;
