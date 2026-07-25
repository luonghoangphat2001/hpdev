'use strict';

class DashboardController {
  constructor(readModelService, lifecycleService = null) {
    this.readModelService = readModelService;
    this.lifecycleService = lifecycleService;
  }

  async overview(_req, res) {
    const overview = await this.readModelService.getOverview();
    return res.json({ ok: true, overview });
  }

  async agents(_req, res) {
    const agents = await this.readModelService.getAgents();
    return res.json({ ok: true, count: agents.length, agents });
  }

  async controlAgent(req, res) {
    const result = await this.lifecycleService.transition({
      agentId: req.params.agentId,
      toState: req.body?.toState,
      expectedVersion: req.body?.expectedVersion,
      actorId: req.body?.actorId,
      reason: req.body?.reason,
    });
    return res.json({ ok: true, agent: result });
  }

  async workflows(req, res) {
    const result = await this.readModelService.getWorkflows({
      limit: req.query.limit,
      offset: req.query.offset,
      agentId: req.query.agentId,
      state: req.query.state,
      search: req.query.search,
    });
    return res.json({ ok: true, ...result });
  }
}

module.exports = DashboardController;
