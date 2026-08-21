'use strict';

const TokenMeterPolicy = require('../../../src/policy/budget/token-meter.policy');

describe('T089: Token and Tool Cost Metering Service', () => {
  test('records and aggregates cost by agent', () => {
    const meter = new TokenMeterPolicy();
    meter.recordCost({ model: 'gemini-3.6-flash', agent: 'dan_ops', workflowId: 'wf_1', tool: 'search', tokensUsed: 100, cost: 0.002 });
    meter.recordCost({ model: 'gemini-3.6-flash', agent: 'dan_ops', workflowId: 'wf_2', tool: 'fetch', tokensUsed: 200, cost: 0.004 });

    expect(meter.getTotalCostForAgent('dan_ops')).toBeCloseTo(0.006);
  });
});
