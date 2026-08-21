'use strict';

const AgentReportUiService = require('../../../src/services/reporting/daily/agent-report-ui.service');

describe('T133: Five-Agent Report Center Service', () => {
  test('returns report center overview with deep link base', async () => {
    const service = new AgentReportUiService({});
    const res = await service.getReportCenterOverview();

    expect(res.reportsAvailable.length).toBe(3);
    expect(res.deepLinkBase).toBe('/dashboard/reports');
  });
});
