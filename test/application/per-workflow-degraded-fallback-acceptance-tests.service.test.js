'use strict';

const PerWorkflowDegradedFallbackAcceptanceTestsService = require('../../src/application/services/per-workflow-degraded-fallback-acceptance-tests.service');

describe('T199: Per-Workflow Degraded Fallback and Acceptance Tests Service', () => {
  test('activates safe fallback to manual review on timeout/budget breach without dropping safety guardrails', () => {
    const service = new PerWorkflowDegradedFallbackAcceptanceTestsService({});

    const result = service.runDegradedFallbackAcceptanceTest({
      workflowId: 'wf_danger_1',
      scenario: 'TIMEOUT_EXCEEDED',
      risk: 'HIGH',
    });

    expect(result.fallbackActivated).toBe(true);
    expect(result.manualReviewTriggered).toBe(true);
    expect(result.safetyGuardrailMaintained).toBe(true);
    expect(result.acceptanceTestPassed).toBe(true);
  });
});
