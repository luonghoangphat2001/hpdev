'use strict';

class MetricsController {
  constructor(registry, config) {
    this.registry = registry;
    this.config = config;
  }

  get(_req, res) {
    return res.json({
      productionEnabled: this.config.orchestratorProductionEnabled,
      collectedAt: new Date().toISOString(),
      metrics: this.registry.snapshot(),
    });
  }
}

module.exports = MetricsController;
