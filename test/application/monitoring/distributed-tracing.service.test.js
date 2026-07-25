'use strict';

const DistributedTracingService = require('../../../src/application/services/monitoring/distributed-tracing.service');

describe('T109: Distributed Tracing Service', () => {
  test('creates trace span with correlation across layers', () => {
    const tracer = new DistributedTracingService();
    const parentSpan = tracer.startTraceSpan({ spanName: 'ssot_webhook_intake' });
    const childSpan = tracer.startTraceSpan({
      traceId: parentSpan.traceId,
      parentSpanId: parentSpan.spanId,
      spanName: 'agent_execution',
    });

    expect(childSpan.traceId).toBe(parentSpan.traceId);
    expect(childSpan.parentSpanId).toBe(parentSpan.spanId);
  });
});
