'use strict';

class PlannerDecomposerFusionService {
  constructor({ plannerService }) {
    this.plannerService = plannerService;
  }

  decomposeWorkflowTask({ goalText, complexity = 'SIMPLE' }) {
    if (complexity === 'SIMPLE') {
      return Object.freeze({
        complexity,
        structuredCallsUsed: 1,
        steps: [Object.freeze({ stepId: 'step_1', action: 'EXECUTE_DIRECT' })],
        decomposedAt: new Date().toISOString(),
      });
    }

    return Object.freeze({
      complexity: 'COMPLEX',
      structuredCallsUsed: 3,
      steps: [
        Object.freeze({ stepId: 'step_1', action: 'ANALYZE' }),
        Object.freeze({ stepId: 'step_2', action: 'EXECUTE_MULTI' }),
      ],
      decomposedAt: new Date().toISOString(),
    });
  }
}

module.exports = PlannerDecomposerFusionService;
