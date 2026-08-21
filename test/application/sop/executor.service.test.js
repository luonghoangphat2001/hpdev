'use strict';

const SopExecutorService = require('../../../src/services/workflow/sop/sop-executor.service');

describe('T173: SOP/Direct Deterministic Executor Service', () => {
  test('executes routine task via deterministic SOP rules with zero LLM calls', () => {
    const service = new SopExecutorService({});
    const res = service.executeRoutineTask({ taskName: 'DAILY_KPI_CHECK', params: {} });

    expect(res.status).toBe('SOP_EXECUTED_SUCCESS');
    expect(res.llmCallsUsed).toBe(0);
    expect(res.executedViaSopRules).toBe(true);
  });
});
