'use strict';

const express = require('express');
const auth = require('./middlewares/auth.middleware');
const searchRouter = require('./routes/search.route');
const fetchRouter = require('./routes/fetch.route');
const crawlRouter = require('./routes/crawl.route');
const automateRouter = require('./routes/automate.route');
const { buildEventIntakeRouter } = require('./composition/event-intake.composition');
const { buildApprovalRouter } = require('./composition/approval.composition');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const metricsRegistry = require('./infrastructure/observability');
const HttpMetricsMiddleware = require('./middlewares/http-metrics.middleware');
const MetricsController = require('./controllers/metrics.controller');
const env = require('./config/env');
const { buildCapabilityRegistry } = require('./composition/capability-registry.composition');
const CapabilityController = require('./controllers/capability.controller');
const { buildOperatorControlRouter } = require('./composition/operator-control.composition');
const { buildCeoCommandRouter } = require('./composition/ceo-command.composition');
const { buildCeoExceptionRouter } = require('./composition/ceo-exception.composition');
const { buildDashboardRouter } = require('./composition/dashboard.composition');

class App {
  constructor() {
    this.app = express();
    this.registerMiddlewares();
    this.registerRoutes();
    this.registerErrorHandlers();
  }

  registerMiddlewares() {
    this.app.use(express.json({
      limit: '10mb',
      verify: (req, _res, buffer) => {
        req.rawBody = Buffer.from(buffer);
      },
    }));
    const metrics = new HttpMetricsMiddleware({ registry: metricsRegistry });
    this.app.use(metrics.handle.bind(metrics));
  }

  registerRoutes() {
    this.app.get('/health', (_req, res) => res.json({ status: 'ok' }));
    this.app.use('/orchestrator/v1/events', buildEventIntakeRouter());

    this.app.use(auth);
    const metricsController = new MetricsController(metricsRegistry, env);
    this.app.get('/orchestrator/v1/metrics', metricsController.get.bind(metricsController));
    const capabilityController = new CapabilityController(buildCapabilityRegistry());
    this.app.get(
      '/orchestrator/v1/capabilities',
      capabilityController.list.bind(capabilityController)
    );
    this.app.use('/orchestrator/v1/approvals', buildApprovalRouter());
    this.app.use('/orchestrator/v1/control', buildOperatorControlRouter());
    this.app.use('/orchestrator/v1/commands', buildCeoCommandRouter());
    this.app.use('/orchestrator/v1/exceptions', buildCeoExceptionRouter());
    this.app.use('/orchestrator/v1/dashboard', buildDashboardRouter());
    this.app.use('/search', searchRouter);
    this.app.use('/fetch', fetchRouter);
    this.app.use('/crawl', crawlRouter);
    this.app.use('/automate', automateRouter);
  }

  registerErrorHandlers() {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  getExpressApp() {
    return this.app;
  }
}

module.exports = new App().getExpressApp();
module.exports.App = App;
