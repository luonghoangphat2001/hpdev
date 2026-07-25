'use strict';

const CeoDashboardIaService = require('../../../src/application/services/ceo/ceo-dashboard-ia.service');

describe('T121: CEO Dashboard Information Architecture Service', () => {
  test('returns frozen navigation map and page hierarchy', () => {
    const service = new CeoDashboardIaService();
    const nav = service.getNavigationMap();

    expect(nav.pages.length).toBeGreaterThan(0);
    expect(nav.permissions).toContain('CEO');
  });
});
