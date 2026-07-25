'use strict';

const OrchestratorIntegrationHarness = require('../support/orchestrator.integration-harness');

describe('orchestration integration baseline', () => {
  test('aggregates all registered agents and preserves one-message-per-day delivery', async () => {
    const harness = new OrchestratorIntegrationHarness();
    harness.seedAgentMetrics('dan_cfo', {
      workflowCount: 3,
      completedCount: 2,
      failedCount: 0,
      awaitingApprovalCount: 1,
      actionCount: 2,
    });

    const first = await harness.runDailyReport('2026-07-25');
    const replay = await harness.runDailyReport('2026-07-25');

    expect(first.reports.map(({ agentId }) => agentId)).toEqual([
      'dan_rnd',
      'dan_logistics',
      'dan_cfo',
      'dan_ops',
      'dan_cskh',
    ]);
    expect(first.reports.find(({ agentId }) => agentId === 'dan_cfo').metrics)
      .toMatchObject({ workflowCount: 3, awaitingApprovalCount: 1 });
    expect(first.receipt.duplicate).toBe(false);
    expect(replay.receipt.duplicate).toBe(true);
    expect(harness.notifications).toHaveLength(1);
  });
});
