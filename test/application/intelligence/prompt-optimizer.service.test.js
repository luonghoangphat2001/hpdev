'use strict';

const PromptOptimizerService = require('@services/ai/context/prompt-optimizer.service');

describe('T092: Prompt/Context Budget Optimizer Service', () => {
  test('truncates text exceeding token ceiling', () => {
    const optimizer = new PromptOptimizerService({ maxTokenCeiling: 10 });
    const result = optimizer.optimizeContext('This is a very long text context');

    expect(result.truncated).toBe(true);
    expect(result.text).toContain('TRUNCATED');
  });
});
