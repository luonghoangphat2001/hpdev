'use strict';

class CeoDashboardIaService {
  getNavigationMap() {
    return Object.freeze({
      pages: Object.freeze([
        { id: 'overview', title: 'OpenClaw Overview', path: '/overview' },
        { id: 'agents', title: '5 Agent Management', path: '/agents' },
        { id: 'workflows', title: 'Workflows & Timelines', path: '/workflows' },
        { id: 'inbox', title: 'Approvals & Exceptions', path: '/inbox' },
        { id: 'reports', title: 'Executive Reports', path: '/reports' },
        { id: 'settings', title: 'SOP & Autonomy Controls', path: '/settings' },
      ]),
      permissions: Object.freeze(['CEO', 'OPERATOR', 'VIEWER']),
    });
  }
}

module.exports = CeoDashboardIaService;
