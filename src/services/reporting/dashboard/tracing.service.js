/**
 * @fileoverview tracing.service - Provides tracing functionality.
 */
'use strict';

/**
 * TracingService
 * Manages tracing logic.
 */
class TracingService {
  /**
   * startTraceSpan - Executes start trace span.
   * @param {*} traceId - Input parameter.
   * @param {*} spanName - Input parameter.
   * @param {*} parentSpanId - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = TracingService;
