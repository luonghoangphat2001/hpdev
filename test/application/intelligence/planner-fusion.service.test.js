'use strict';

const PlannerFusionService = require('@services/ai/critics/planner-fusion.service');

describe('T174: Planner/Decomposer Fusion Service', () => {
  test('fuses simple planner decomposition into single structured call', () => {
    const service = new PlannerFusionService({});
    const simple = service.decomposeWorkflowTask({ goalText: 'Check inventory', complexity: 'SIMPLE' });

    expect(simple.structuredCallsUsed).toBe(1);
    expect(simple.steps.length).toBe(1);

    const complex = service.decomposeWorkflowTask({ goalText: 'Launch product campaign', complexity: 'COMPLEX' });
    expect(complex.structuredCallsUsed).toBeGreaterThan(1);
  });
});
