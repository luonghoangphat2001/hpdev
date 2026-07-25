'use strict';

class AlertEscalationService {
  evaluateAlert({ severity = 'INFO', owner = 'dan_ops', metricValue = 0 }) {
    let escalationTimerMinutes = 0;
    if (severity === 'CRITICAL') {
      escalationTimerMinutes = 5;
    } else if (severity === 'HIGH') {
      escalationTimerMinutes = 15;
    }

    return Object.freeze({
      severity,
      owner,
      metricValue,
      escalationTimerMinutes,
      dedupedKey: `${severity}:${owner}`,
      triggeredAt: new Date().toISOString(),
    });
  }
}

module.exports = AlertEscalationService;
