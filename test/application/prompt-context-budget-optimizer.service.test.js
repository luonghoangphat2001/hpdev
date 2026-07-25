'use strict';

const PromptContextBudgetOptimizerService = require('../../src/application/services/prompt-context-budget-optimizer.service');

describe('T092: Prompt/Context Budget Optimizer Service', () => {
  test('truncates text exceeding token ceiling', () => {
    const optimizer = new PromptContextBudgetOptimizerService({ maxTokenCeiling: 10 });
    const result = optimizer.optimizeContext('This is a very long text context');

    expect(result.truncated).toBe(true);
    expect(result.text).toContain('TRUNCATED');
  });
});
