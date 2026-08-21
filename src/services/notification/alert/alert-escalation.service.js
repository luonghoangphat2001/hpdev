/**
 * @fileoverview alert-escalation.service - Provides alert-escalation functionality.
 */
'use strict';

/**
 * AlertEscalationService
 * Manages alert escalation logic.
 */
class AlertEscalationService {
  /**
   * evaluateAlert - Executes evaluate alert.
   * @param {*} severity - Input parameter.
   * @param {*} owner - Input parameter.
   * @param {*} metricValue - Input parameter.
   * @returns {*} Result of operation.
   */
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
