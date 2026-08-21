/**
 * @fileoverview resilient-ssot.client - Provides resilient-ssot functionality.
 */
'use strict';

const resiliencePolicy = require('../../../schemas/policy/retry.policy');
const CircuitBreaker = require('./circuit-breaker');

const ERROR_CODE_MAP = Object.freeze({
  ssot_rate_limited: 'rate_limited',
  ssot_timeout: 'upstream_timeout',
  ssot_upstream_unavailable: 'upstream_unavailable',
  ssot_request_failed: 'network_error',
  ssot_validation_error: 'validation_error',
  ssot_authentication_failed: 'authentication_failed',
  ssot_permission_denied: 'permission_denied',
  ssot_resource_not_found: 'resource_not_found',
  ssot_version_conflict: 'request_conflict',
  ssot_business_rule_rejected: 'business_rule_rejected',
});

/**
 * ResilientSsotClient
 * Manages resilient ssot client logic.
 */
class ResilientSsotClient {
  constructor({
    client,
    policy = resiliencePolicy,
    circuitBreaker = new CircuitBreaker(),
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }) {
    this.client = client;
    this.policy = policy;
    this.circuitBreaker = circuitBreaker;
    this.sleep = sleep;
  }

  /**
   * request - Asynchronously executes request.
   * @param {*} options - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async request(options) {
    const { actionName, idempotencyKey } = options;
    const callPolicy = this.policy.getCallPolicy(actionName);
    if (!callPolicy) {
      const error = new Error(`No resilience policy for action: ${actionName}`);
      error.code = 'resilience_policy_missing';
      throw error;
    }

    this.circuitBreaker.assertRequestAllowed(actionName);
    let attempt = 1;

    while (attempt <= callPolicy.maxAttempts) {
      try {
        const result = await this.client.request({
          ...options,
          timeoutMs: options.timeoutMs || callPolicy.timeoutMs,
        });
        this.circuitBreaker.recordSuccess(actionName);
        return result;
      } catch (error) {
        const errorCode = ERROR_CODE_MAP[error.code] || 'internal_error';
        const canRetry = this.policy.canRetry({
          errorCode,
          actionName,
          attempt,
          hasIdempotencyKey: Boolean(idempotencyKey),
        });
        if (!canRetry) {
          if (this.policy.getErrorPolicy(errorCode).retryable) {
            this.circuitBreaker.recordFailure(actionName);
          }
          throw error;
        }

        const delay = callPolicy.backoffMs[
          Math.min(attempt - 1, callPolicy.backoffMs.length - 1)
        ];
        await this.sleep(delay);
        attempt += 1;
      }
    }

    throw new Error('Unreachable retry state');
  }
}

module.exports = ResilientSsotClient;
module.exports.ERROR_CODE_MAP = ERROR_CODE_MAP;
