'use strict';

const BaseController = require('./base.controller');
const CrawlService = require('../services/crawl.service');
const CrawlValidation = require('../validations/crawl.validation');

class CrawlController extends BaseController {
  constructor(service = new CrawlService(), validation = new CrawlValidation()) {
    super();
    this.service = service;
    this.validation = validation;
  }

  async crawl(req, res) {
    const payload = this.validation.validateCrawl(req.body);
    const result = await this.service.crawl(payload);

    return this.ok(res, result);
  }
}

module.exports = CrawlController;
