'use strict';

const IntelligenceObservabilityRepository =
  require('../../../domain/repositories/intelligence-observability.repository');

class MysqlIntelligenceObservabilityRepository extends IntelligenceObservabilityRepository {
  constructor(executor) {
    super();
    this.executor = executor;
  }

  async appendTrace(span) {
    await this.executor.execute(
      `INSERT INTO intelligence_traces (
         trace_id, span_id, parent_span_id, workflow_id, stage, component_id,
         status, latency_ms, tokens_in, tokens_out, cost_usd, error_code,
         metadata, occurred_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        span.traceId,
        span.spanId,
        span.parentSpanId,
        span.workflowId,
        span.stage,
        span.componentId,
        span.status,
        span.latencyMs,
        span.tokensIn,
        span.tokensOut,
        span.costUsd,
        span.errorCode,
        JSON.stringify(span.metadata),
        span.occurredAt,
      ],
    );
    return span;
  }

  async findPendingFeedback(limit = 50) {
    const [rows] = await this.executor.execute(
      `SELECT * FROM workflow_feedback
       WHERE review_status = 'pending'
       ORDER BY rating ASC, created_at ASC
       LIMIT ?`,
      [Math.min(Math.max(Number(limit) || 50, 1), 200)],
    );
    return rows;
  }
}

module.exports = MysqlIntelligenceObservabilityRepository;
