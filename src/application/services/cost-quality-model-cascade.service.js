'use strict';

class CostQualityModelCascadeService {
  constructor({ costAwareModelRouter }) {
    this.costAwareModelRouter = costAwareModelRouter;
  }

  selectModelForTask({ risk = 'LOW', confidence = 0.95, complexity = 'SIMPLE' }) {
    let targetModel = 'rule-based-0-llm';
    if (risk === 'HIGH' || complexity === 'COMPLEX') {
      targetModel = 'gemini-3.6-pro';
    } else if (confidence < 0.85) {
      targetModel = 'gemini-3.6-flash-medium';
    } else if (complexity === 'MEDIUM') {
      targetModel = 'gemini-3.6-flash-small';
    }

    return Object.freeze({
      selectedModel: targetModel,
      risk,
      confidence,
      complexity,
      selectedAt: new Date().toISOString(),
    });
  }
}

module.exports = CostQualityModelCascadeService;
