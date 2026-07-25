'use strict';

class AlertIncidentCenterUiService {
  constructor({ alertEscalationService }) {
    this.alertEscalationService = alertEscalationService;
  }

  getIncidents() {
    return Object.freeze([
      { incidentId: 'inc_01', severity: 'WARNING', title: 'High API latency on provider google', status: 'ACKNOWLEDGED' },
    ]);
  }

  acknowledgeIncident(incidentId) {
    return Object.freeze({
      incidentId,
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date().toISOString(),
    });
  }
}

module.exports = AlertIncidentCenterUiService;
