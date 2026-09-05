'use strict';

const ModelCascadePolicy = require('@policy/budget/model-cascade.policy');

describe('T178: Cost/Quality-Aware Model Cascade Service', () => {
  test('cascades from rule to small, medium, and strong LLMs based on risk and confidence', () => {
    const service = new ModelCascadePolicy({});
    const rule = service.selectModelForTask({ risk: 'LOW', confidence: 0.95, complexity: 'SIMPLE' });
    expect(rule.selectedModel).toBe('rule-based-0-llm');

    const strong = service.selectModelForTask({ risk: 'HIGH', confidence: 0.95, complexity: 'COMPLEX' });
    expect(strong.selectedModel).toBe('gemini-3.6-pro');
  });
});
