'use strict';

const ContextMinimizerService = require('../../../src/services/ai/context/context-minimizer.service');

describe('T179: Context Minimizer and Targeted Retrieval Service', () => {
  test('minimizes context fields according to token ceiling and versioning', () => {
    const service = new ContextMinimizerService();
    const res = service.minimizeContext({
      fullContextData: { field1: 'a', field2: 'b', field3: 'c', field4: 'd' },
      tokenCeiling: 1000,
    });

    expect(res.tokenCeiling).toBe(1000);
    expect(Object.keys(res.minifiedContext).length).toBe(3);
    expect(res.summaryVersion).toBe('v1.0');
  });
});
