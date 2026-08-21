'use strict';

const ResilientSsotClient = require('../../../src/services/notification/adapter/resilient-ssot.client');
const CircuitBreaker = require('../../../src/services/notification/adapter/circuit-breaker');
const { CircuitOpenError } = require('../../../src/services/notification/adapter/circuit-breaker');

describe('ResilientSsotClient', () => {
  it('retries transient reads with configured backoff and timeout', async () => {
    const timeout = Object.assign(new Error('timeout'), { code: 'ssot_timeout' });
    const client = {
      request: jest.fn()
        .mockRejectedValueOnce(timeout)
        .mockRejectedValueOnce(timeout)
        .mockResolvedValue({ data: 1 }),
    };
    const sleep = jest.fn().mockResolvedValue();
    const resilient = new ResilientSsotClient({ client, sleep });

    await expect(resilient.request({
      actionName: 'order.read',
      method: 'GET',
      path: '/orders/1',
    })).resolves.toEqual({ data: 1 });
    expect(client.request).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map(([delay]) => delay)).toEqual([250, 1000]);
    expect(client.request.mock.calls[0][0].timeoutMs).toBe(5000);
  });

  it('does not retry business or permission errors', async () => {
    const error = Object.assign(new Error('forbidden'), {
      code: 'ssot_permission_denied',
    });
    const client = { request: jest.fn().mockRejectedValue(error) };
    const sleep = jest.fn();
    const resilient = new ResilientSsotClient({ client, sleep });

    await expect(resilient.request({
      actionName: 'order.read',
      method: 'GET',
      path: '/orders/1',
    })).rejects.toBe(error);
    expect(client.request).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('never retries writes without an idempotency key', async () => {
    const error = Object.assign(new Error('network'), {
      code: 'ssot_request_failed',
    });
    const client = { request: jest.fn().mockRejectedValue(error) };
    const resilient = new ResilientSsotClient({ client, sleep: jest.fn() });

    await expect(resilient.request({
      actionName: 'ops.order_status.update',
      method: 'POST',
      path: '/orders/1/status',
    })).rejects.toBe(error);
    expect(client.request).toHaveBeenCalledTimes(1);
  });

  it('opens the circuit after repeated transient request failures', async () => {
    let now = 1000;
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      cooldownMs: 30000,
      clock: () => now,
    });
    const error = Object.assign(new Error('down'), {
      code: 'ssot_upstream_unavailable',
    });
    const client = { request: jest.fn().mockRejectedValue(error) };
    const policy = {
      getCallPolicy: () => ({
        timeoutMs: 10,
        maxAttempts: 1,
        backoffMs: [0],
      }),
      getErrorPolicy: () => ({ retryable: true }),
      canRetry: () => false,
    };
    const resilient = new ResilientSsotClient({
      client,
      policy,
      circuitBreaker: breaker,
    });
    const request = { actionName: 'order.read', method: 'GET', path: '/orders/1' };

    await expect(resilient.request(request)).rejects.toBe(error);
    await expect(resilient.request(request)).rejects.toBe(error);
    await expect(resilient.request(request)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(client.request).toHaveBeenCalledTimes(2);

    now += 30001;
    client.request.mockResolvedValueOnce({ data: 'recovered' });
    await expect(resilient.request(request)).resolves.toEqual({ data: 'recovered' });
  });

  it('fails closed when an action has no resilience policy', async () => {
    const resilient = new ResilientSsotClient({
      client: { request: jest.fn() },
    });
    await expect(resilient.request({
      actionName: 'unknown.action',
    })).rejects.toMatchObject({ code: 'resilience_policy_missing' });
  });
});
