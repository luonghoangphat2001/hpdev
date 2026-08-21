/**
 * @fileoverview center-ui.service - Provides center-ui functionality.
 */
'use strict';

/**
 * CenterUiService
 * Manages center ui logic.
 */
class CenterUiService {
  /**
   * constructor - Executes constructor.
   * @param {*} alertEscalationService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ alertEscalationService }) {
    this.alertEscalationService = alertEscalationService;
  }

  /**
   * getIncidents - Executes get incidents.
   * @returns {*} Result of operation.
   */
  getIncidents() {
    return Object.freeze([
      { incidentId: 'inc_01', severity: 'WARNING', title: 'High API latency on provider google', status: 'ACKNOWLEDGED' },
    ]);
  }

  /**
   * acknowledgeIncident - Executes acknowledge incident.
   * @param {*} incidentId - Input parameter.
   * @returns {*} Result of operation.
   */
  acknowledgeIncident(incidentId) {
    return Object.freeze({
      incidentId,
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date().toISOString(),
    });
  }
}

module.exports = CenterUiService;
