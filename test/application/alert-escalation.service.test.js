'use strict';

const AlertEscalationService = require('../../src/application/services/alert-escalation.service');

describe('T110: Alert Rules and Escalation Routing Service', () => {
  test('evaluates CRITICAL alert with 5 min escalation timer', () => {
    const service = new AlertEscalationService();
    const alert = service.evaluateAlert({ severity: 'CRITICAL', owner: 'dan_cfo', metricValue: 99 });

    expect(alert.escalationTimerMinutes).toBe(5);
    expect(alert.dedupedKey).toBe('CRITICAL:dan_cfo');
  });
});
