'use strict';

const AlertIncidentCenterUiService = require('../../src/application/services/alert-incident-center-ui.service');

describe('T136: Alert and Incident Center UI Service', () => {
  test('lists incidents and acknowledges incident', () => {
    const service = new AlertIncidentCenterUiService({});
    const incidents = service.getIncidents();
    const ack = service.acknowledgeIncident('inc_01');

    expect(incidents.length).toBe(1);
    expect(ack.status).toBe('ACKNOWLEDGED');
  });
});
