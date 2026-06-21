'use strict';

const express = require('express');
const CrawlController = require('../controllers/crawl.controller');
const { asyncHandler } = require('../middlewares/error.middleware');

class CrawlRoute {
  constructor(controller = new CrawlController()) {
    this.router = express.Router();
    this.controller = controller;
    this.register();
  }

  register() {
    this.router.post('/', asyncHandler(this.controller.crawl.bind(this.controller)));
  }
}

module.exports = new CrawlRoute().router;
module.exports.CrawlRoute = CrawlRoute;
