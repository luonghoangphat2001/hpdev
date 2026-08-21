/**
 * @fileoverview telemetry.service - Provides telemetry functionality.
 */
'use strict';

const crypto = require('crypto');

const STAGES = new Set(['planner', 'agent', 'model', 'tool']);

/**
 * TelemetryService
 * Manages telemetry logic.
 */
class TelemetryService {
  constructor({
    repository,
    metrics,
    notificationGateway = null,
    thresholds = {},
    clock = () => new Date(),
    idFactory = () => `spn_${crypto.randomUUID()}`,
  }) {
    this.repository = repository;
    this.metrics = metrics;
    this.notificationGateway = notificationGateway;
    this.thresholds = {
      latencyMs: Number(thresholds.latencyMs || 30000),
      tokens: Number(thresholds.tokens || 10000),
      costUsd: Number(thresholds.costUsd || 1),
    };
    this.clock = clock;
    this.idFactory = idFactory;
  }

  /**
   * record - Asynchronously executes record.
   * @param {*} input - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async record(input) {
    this.#validate(input);
    const span = Object.freeze({
      traceId: input.traceId,
      spanId: input.spanId || this.idFactory(),
      parentSpanId: input.parentSpanId || null,
      workflowId: input.workflowId,
      stage: input.stage,
      componentId: input.componentId,
      status: input.status,
      latencyMs: Math.max(0, Number(input.latencyMs || 0)),
      tokensIn: Math.max(0, Number(input.tokensIn || 0)),
      tokensOut: Math.max(0, Number(input.tokensOut || 0)),
      costUsd: Math.max(0, Number(input.costUsd || 0)),
      errorCode: input.errorCode || null,
      metadata: Object.freeze({ ...(input.metadata || {}) }),
      occurredAt: input.occurredAt || this.clock(),
    });
    await this.repository.appendTrace(span);
    const labels = {
      stage: span.stage,
      component: span.componentId,
      status: span.status,
    };
    this.metrics.increment('intelligence_spans_total', labels);
    this.metrics.increment(
      'intelligence_tokens_total',
      { stage: span.stage, component: span.componentId },
      span.tokensIn + span.tokensOut,
    );
    this.metrics.observe('intelligence_latency_ms', span.latencyMs, labels);
    await this.#alertIfNeeded(span);
    return span;
  }

  /**
   * feedbackQueue - Asynchronously executes feedback queue.
   * @param {*} limit - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async feedbackQueue(limit = 50) {
    return this.repository.findPendingFeedback(limit);
  }

  async #alertIfNeeded(span) {
    if (!this.notificationGateway) return;
    const warnings = [];
    if (span.latencyMs > this.thresholds.latencyMs) warnings.push('latency');
    if (span.tokensIn + span.tokensOut > this.thresholds.tokens) warnings.push('token');
    if (span.costUsd > this.thresholds.costUsd) warnings.push('cost');
    if (span.status === 'failed') warnings.push('failure');
    if (warnings.length === 0) return;

    await this.notificationGateway.notify({
      idempotencyKey: `intelligence-alert:${span.traceId}:${span.spanId}`,
      title: `OpenClaw intelligence warning — ${span.componentId}`,
      message: `Workflow ${span.workflowId}: ${warnings.join(', ')} threshold exceeded.`,
      severity: span.status === 'failed' ? 'critical' : 'warning',
    });
  }

  #validate(input = {}) {
    if (!input.traceId || !input.workflowId || !input.componentId
      || !STAGES.has(input.stage)
      || !['completed', 'failed', 'degraded'].includes(input.status)) {
      throw new TypeError('Invalid intelligence trace');
    }
  }
}

module.exports = TelemetryService;
