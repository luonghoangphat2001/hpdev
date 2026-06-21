'use strict';

const express = require('express');
const auth = require('./middlewares/auth.middleware');
const searchRouter = require('./routes/search.route');
const fetchRouter = require('./routes/fetch.route');
const crawlRouter = require('./routes/crawl.route');
const automateRouter = require('./routes/automate.route');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

class App {
  constructor() {
    this.app = express();
    this.registerMiddlewares();
    this.registerRoutes();
    this.registerErrorHandlers();
  }

  registerMiddlewares() {
    this.app.use(express.json({ limit: '10mb' }));
  }

  registerRoutes() {
    this.app.get('/health', (_req, res) => res.json({ status: 'ok' }));

    this.app.use(auth);
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
