/**
 * @fileoverview model-cascade.policy - Provides model-cascade functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

/**
 * ModelCascadePolicy
 * Manages model cascade logic.
 */
class ModelCascadePolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @param {*} costAwareModelRouter - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ costAwareModelRouter }) {
    super({ name: 'ModelCascadePolicy' });


    this.costAwareModelRouter = costAwareModelRouter;
  }

  /**
   * selectModelForTask - Executes select model for task.
   * @param {*} risk - Input parameter.
   * @param {*} confidence - Input parameter.
   * @param {*} complexity - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = ModelCascadePolicy;
