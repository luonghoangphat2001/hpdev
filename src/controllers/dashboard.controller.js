'use strict';

class DashboardController {
  constructor(readModelService) {
    this.readModelService = readModelService;
  }

  async overview(_req, res) {
    const overview = await this.readModelService.getOverview();
    return res.json({ ok: true, overview });
  }
}

module.exports = DashboardController;
