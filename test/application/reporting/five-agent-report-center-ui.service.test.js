'use strict';

const FiveAgentReportCenterUiService = require('../../../src/application/services/reporting/five-agent-report-center-ui.service');

describe('T133: Five-Agent Report Center Service', () => {
  test('returns report center overview with deep link base', async () => {
    const service = new FiveAgentReportCenterUiService({});
    const res = await service.getReportCenterOverview();

    expect(res.reportsAvailable.length).toBe(3);
    expect(res.deepLinkBase).toBe('/dashboard/reports');
  });
});
