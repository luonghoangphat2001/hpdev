'use strict';

class DashboardController {
  constructor(readModelService) {
    this.readModelService = readModelService;
  }

  async overview(_req, res) {
    const overview = await this.readModelService.getOverview();
    return res.json({ ok: true, overview });
  }

  async agents(_req, res) {
    const agents = await this.readModelService.getAgents();
    return res.json({ ok: true, count: agents.length, agents });
  }
}

module.exports = DashboardController;
