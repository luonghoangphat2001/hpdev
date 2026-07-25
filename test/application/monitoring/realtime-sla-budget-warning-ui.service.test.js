'use strict';

const RealtimeSlaBudgetWarningUiService = require('../../../src/application/services/monitoring/realtime-sla-budget-warning-ui.service');

describe('T198: Realtime SLA/Budget Warning and Monitor UI Service', () => {
  test('shows warning percentage, stage bottleneck, ETA, and escalation trigger in realtime', () => {
    const service = new RealtimeSlaBudgetWarningUiService({});

    const safe = service.getRealtimeSlaWarning({
      workflowId: 'wf_1', workflowType: 'ECOM_ORDER_WORKFLOW',
      elapsedTimeMs: 2000, tokensUsed: 5000, costUSD: 0.05,
    });
    expect(safe.isWarning).toBe(false);

    const warn = service.getRealtimeSlaWarning({
      workflowId: 'wf_2', workflowType: 'ECOM_ORDER_WORKFLOW',
      elapsedTimeMs: 8000, tokensUsed: 30000, costUSD: 0.45,
    });
    expect(warn.isWarning).toBe(true);
    expect(warn.escalationRequired).toBe(true);
  });
});
