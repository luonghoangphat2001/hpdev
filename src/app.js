/**
 * @fileoverview app - Provides app functionality.
 */
'use strict';

const express = require('express');
const createWebRouter = require('./routes/web');
const createApiRouter = require('./routes/api');
const { createControllers } = require('./controllers/container');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const metricsRegistry = require('./utils/metrics-registry');
const HttpMetricsMiddleware = require('./middleware/http-metrics.middleware');

/**
 * App
 * Manages app logic.
 */
class App {
  constructor({ controllers = createControllers() } = {}) {
    this.app = express();
    this.controllers = controllers;
    this.registerMiddlewares();
    this.registerRoutes();
    this.registerErrorHandlers();
  }

  /**
   * registerMiddlewares - Executes register middlewares.
   * @returns {*} Result of operation.
   */
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

  /**
   * registerRoutes - Executes register routes.
   * @returns {*} Result of operation.
   */
  registerRoutes() {
    // 1. Web / health routes
    this.app.use('/', createWebRouter());

    // 2. REST API routes
    this.app.use('/', createApiRouter(this.controllers));
  }

  /**
   * registerErrorHandlers - Executes register error handlers.
   * @returns {*} Result of operation.
   */
  registerErrorHandlers() {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  /**
   * getExpressApp - Executes get express app.
   * @returns {*} Result of operation.
   */
  getExpressApp() {
    return this.app;
  }
}

module.exports = new App().getExpressApp();
module.exports.App = App;
