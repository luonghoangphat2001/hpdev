'use strict';

const IntelligenceTelemetryService = require('../../../src/application/services/observability/intelligence-telemetry.service');
const { MetricsRegistry } = require('../../../src/infrastructure/observability');

describe('IntelligenceTelemetryService', () => {
  function build() {
    const repository = {
      appendTrace: jest.fn(async (span) => span),
      findPendingFeedback: jest.fn().mockResolvedValue([{ feedback_id: 'fdb_1', rating: 2 }]),
    };
    const notificationGateway = { notify: jest.fn().mockResolvedValue({}) };
    const metrics = new MetricsRegistry();
    const service = new IntelligenceTelemetryService({
      repository,
      notificationGateway,
      metrics,
      thresholds: { latencyMs: 1000, tokens: 1000, costUsd: 0.1 },
      clock: () => new Date('2026-07-25T08:00:00Z'),
      idFactory: () => 'spn_1',
    });
    return { service, repository, notificationGateway, metrics };
  }

  test('persists planner/agent/model/tool telemetry and updates KPI metrics', async () => {
    const { service, repository, metrics } = build();
    await service.record({
      traceId: 'trc_1',
      workflowId: 'wfl_1',
      stage: 'model',
      componentId: 'balanced',
      status: 'completed',
      latencyMs: 500,
      tokensIn: 300,
      tokensOut: 200,
      costUsd: 0.02,
      metadata: { fallbackCount: 0 },
    });

    expect(repository.appendTrace).toHaveBeenCalledWith(expect.objectContaining({
      spanId: 'spn_1',
      tokensIn: 300,
      tokensOut: 200,
    }));
    expect(metrics.snapshot().counters).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'intelligence_spans_total', value: 1 }),
      expect.objectContaining({ name: 'intelligence_tokens_total', value: 500 }),
    ]));
  });

  test('alerts once when latency, budget, cost, or failure thresholds are exceeded', async () => {
    const { service, notificationGateway } = build();
    await service.record({
      traceId: 'trc_2',
      spanId: 'spn_slow',
      workflowId: 'wfl_2',
      stage: 'agent',
      componentId: 'dan_cfo',
      status: 'failed',
      latencyMs: 1500,
      tokensIn: 900,
      tokensOut: 200,
      costUsd: 0.2,
      errorCode: 'agent_timeout',
    });

    expect(notificationGateway.notify).toHaveBeenCalledTimes(1);
    expect(notificationGateway.notify).toHaveBeenCalledWith({
      idempotencyKey: 'intelligence-alert:trc_2:spn_slow',
      title: 'OpenClaw intelligence warning — dan_cfo',
      message: expect.stringContaining('latency, token, cost, failure'),
      severity: 'critical',
    });
  });

  test('exposes low-rated feedback through an improvement queue', async () => {
    const { service, repository } = build();
    await expect(service.feedbackQueue(10))
      .resolves.toEqual([{ feedback_id: 'fdb_1', rating: 2 }]);
    expect(repository.findPendingFeedback).toHaveBeenCalledWith(10);
  });
});
