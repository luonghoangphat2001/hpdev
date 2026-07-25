'use strict';

class DistributedTracingService {
  startTraceSpan({ traceId, spanName, parentSpanId }) {
    const activeTraceId = traceId || `trace_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

    return Object.freeze({
      traceId: activeTraceId,
      spanId,
      parentSpanId: parentSpanId || null,
      spanName,
      startedAt: new Date().toISOString(),
    });
  }
}

module.exports = DistributedTracingService;
