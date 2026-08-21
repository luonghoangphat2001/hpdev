'use strict';

const CenterUiService = require('../../../src/services/notification/alert/center-ui.service');

describe('T136: Alert and Incident Center UI Service', () => {
  test('lists incidents and acknowledges incident', () => {
    const service = new CenterUiService({});
    const incidents = service.getIncidents();
    const ack = service.acknowledgeIncident('inc_01');

    expect(incidents.length).toBe(1);
    expect(ack.status).toBe('ACKNOWLEDGED');
  });
});
