'use strict';

const GlobalEmergencyStopService = require('../../src/application/services/global-emergency-stop.service');

describe('T096: Global/Agent Emergency Stop Service', () => {
  test('stops specific agent or global system atomically', () => {
    const service = new GlobalEmergencyStopService();

    expect(service.isAgentAllowed('dan_cfo')).toBe(true);
    service.suspendAgent('dan_cfo');
    expect(service.isAgentAllowed('dan_cfo')).toBe(false);
    expect(service.isAgentAllowed('dan_ops')).toBe(true);

    service.triggerGlobalEmergencyStop();
    expect(service.isAgentAllowed('dan_ops')).toBe(false);
  });
});
