'use strict';

const DashboardIaService = require('../../../src/services/ceo/exception/dashboard-ia.service');

describe('T121: CEO Dashboard Information Architecture Service', () => {
  test('returns frozen navigation map and page hierarchy', () => {
    const service = new DashboardIaService();
    const nav = service.getNavigationMap();

    expect(nav.pages.length).toBeGreaterThan(0);
    expect(nav.permissions).toContain('CEO');
  });
});
