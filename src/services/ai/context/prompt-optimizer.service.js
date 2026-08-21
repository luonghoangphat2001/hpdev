/**
 * @fileoverview prompt-optimizer.service - Provides prompt-optimizer functionality.
 */
'use strict';

/**
 * PromptOptimizerService
 * Manages prompt optimizer logic.
 */
class PromptOptimizerService {
  /**
   * constructor - Executes constructor.
   * @param {*} maxTokenCeiling - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ maxTokenCeiling = 4000 } = {}) {
    this.maxTokenCeiling = maxTokenCeiling;
  }

  /**
   * optimizeContext - Executes optimize context.
   * @param {*} contextText - Input parameter.
   * @returns {*} Result of operation.
   */
  optimizeContext(contextText = '') {
    if (contextText.length > this.maxTokenCeiling) {
      const truncated = contextText.substring(0, this.maxTokenCeiling) + '\n...[TRUNCATED_TO_FIT_BUDGET]';
      return Object.freeze({ text: truncated, truncated: true });
    }

    return Object.freeze({ text: contextText, truncated: false });
  }
}

module.exports = PromptOptimizerService;
