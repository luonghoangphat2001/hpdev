'use strict';

class MonitorReadModelAdapter {
  constructor({ openclawClient }) {
    this.openclawClient = openclawClient;
  }

  async getOverviewReadModel() {
    return Object.freeze({
      version: '1.0.0',
      activeAgentsCount: 5,
      pendingApprovalsCount: 0,
      systemHealth: 'UP',
      fetchedAt: new Date().toISOString(),
    });
  }
}

module.exports = MonitorReadModelAdapter;
