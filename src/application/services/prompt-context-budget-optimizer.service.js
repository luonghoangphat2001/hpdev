'use strict';

class PromptContextBudgetOptimizerService {
  constructor({ maxTokenCeiling = 4000 } = {}) {
    this.maxTokenCeiling = maxTokenCeiling;
  }

  optimizeContext(contextText = '') {
    if (contextText.length > this.maxTokenCeiling) {
      const truncated = contextText.substring(0, this.maxTokenCeiling) + '\n...[TRUNCATED_TO_FIT_BUDGET]';
      return Object.freeze({ text: truncated, truncated: true });
    }

    return Object.freeze({ text: contextText, truncated: false });
  }
}

module.exports = PromptContextBudgetOptimizerService;
