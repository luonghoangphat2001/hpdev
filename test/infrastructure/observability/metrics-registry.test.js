'use strict';

const EventEmitter = require('events');
const { MetricsRegistry } = require('../../../src/infrastructure/observability');
const HttpMetricsMiddleware = require('../../../src/middlewares/http-metrics.middleware');

describe('baseline observability', () => {
  test('aggregates counters and latency without high-cardinality payload data', () => {
    const registry = new MetricsRegistry();
    registry.increment('workflow_total', { state: 'completed' });
    registry.increment('workflow_total', { state: 'completed' }, 2);
    registry.observe('workflow_duration_ms', 20, { type: 'order' });
    registry.observe('workflow_duration_ms', 40, { type: 'order' });

    expect(registry.snapshot()).toEqual({
      counters: [{
        name: 'workflow_total',
        labels: { state: 'completed' },
        value: 3,
      }],
      timings: [{
        name: 'workflow_duration_ms',
        labels: { type: 'order' },
        count: 2,
        totalMs: 60,
        maxMs: 40,
        averageMs: 30,
      }],
    });
  });

  test('records HTTP status and duration after the response finishes', () => {
    const registry = new MetricsRegistry();
    const times = [1000, 1025];
    const middleware = new HttpMetricsMiddleware({
      registry,
      clock: () => times.shift(),
    });
    const response = new EventEmitter();
    response.statusCode = 202;
    const next = jest.fn();

    middleware.handle(
      { method: 'POST', path: '/orchestrator/v1/events' },
      response,
      next
    );
    response.emit('finish');

    expect(next).toHaveBeenCalled();
    expect(registry.snapshot().timings[0]).toMatchObject({
      name: 'http_request_duration_ms',
      count: 1,
      totalMs: 25,
      labels: { method: 'POST', route: '/orchestrator/v1/events', status: '202' },
    });
  });
});
