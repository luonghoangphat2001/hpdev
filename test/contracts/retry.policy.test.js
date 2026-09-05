'use strict';

const actionCatalog = require('@schemas/workflow/action.catalog');
const policy = require('@schemas/policy/retry.policy');
const {
  ErrorRetryPolicy,
  ERROR_POLICIES,
  ACTION_TIMEOUTS_MS,
} = require('@schemas/policy/retry.policy');

describe('ErrorRetryPolicy', () => {
  it('defines a positive timeout for every allowlisted SSOT action', () => {
    actionCatalog.list().forEach(({ name }) => {
      expect(policy.getCallPolicy(name)).toMatchObject({
        action: name,
        timeoutMs: expect.any(Number),
        maxAttempts: 3,
      });
      expect(policy.getCallPolicy(name).timeoutMs).toBeGreaterThan(0);
    });
  });

  it('never retries validation, authentication or business errors', () => {
    ['validation_error', 'authentication_failed', 'permission_denied',
      'request_conflict', 'business_rule_rejected'].forEach((errorCode) => {
      expect(policy.canRetry({
        errorCode,
        actionName: 'order.read',
        attempt: 1,
      })).toBe(false);
    });
  });

  it('retries a transient read only within the attempt limit', () => {
    expect(policy.canRetry({
      errorCode: 'upstream_timeout',
      actionName: 'order.read',
      attempt: 1,
    })).toBe(true);
    expect(policy.canRetry({
      errorCode: 'upstream_timeout',
      actionName: 'order.read',
      attempt: 3,
    })).toBe(false);
  });

  it('requires an idempotency key before retrying writes', () => {
    const request = {
      errorCode: 'network_error',
      actionName: 'ops.order_status.update',
      attempt: 1,
    };

    expect(policy.canRetry(request)).toBe(false);
    expect(policy.canRetry({ ...request, hasIdempotencyKey: true })).toBe(true);
  });

  it('does not retry unknown errors or actions', () => {
    expect(policy.getCallPolicy('unknown.action')).toBeNull();
    expect(policy.canRetry({
      errorCode: 'unknown_error',
      actionName: 'order.read',
      attempt: 1,
    })).toBe(false);
  });

  it('fails startup if one action has no timeout policy', () => {
    expect(() => new ErrorRetryPolicy({
      actions: actionCatalog.list(),
      errors: ERROR_POLICIES,
      timeouts: { ...ACTION_TIMEOUTS_MS, 'order.read': 0 },
    })).toThrow('Missing action timeout policies: order.read');
  });
});
