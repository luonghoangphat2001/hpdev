/**
 * @fileoverview WebController - Provides web functionality.
 */
'use strict';

const BaseController = require('./BaseController');

/**
 * WebController
 * Manages web logic.
 */
class WebController extends BaseController {
  /**
   * constructor - Executes constructor.
   * @param {*} services - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(services = {}) {
    super();
    if (services && (services.searchService || services.crawlService || services.automateService || services.fetchService)) {
      this.searchService = services.searchService;
      this.crawlService = services.crawlService;
      this.automateService = services.automateService;
      this.fetchService = services.fetchService;
    } else if (services && typeof services.fetchUrl === 'function') {
      this.fetchService = services;
    } else if (services && typeof services.search === 'function') {
      this.searchService = services;
    } else if (services && typeof services.crawl === 'function') {
      this.crawlService = services;
    } else if (services && typeof services.execute === 'function') {
      this.automateService = services;
    }
  }

  /**
   * search - Asynchronously executes search.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async search(req, res) {
    const { query, num } = req.body || {};
    const result = await this.searchService.search({ query, num });
    return this.ok(res, result);
  }

  /**
   * crawl - Asynchronously executes crawl.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async crawl(req, res) {
    const { url, options } = req.body || {};
    const result = await this.crawlService.crawl({ url, ...options });
    return this.ok(res, result);
  }

  /**
   * automate - Asynchronously executes automate.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async automate(req, res) {
    const { task, options } = req.body || {};
    const result = await this.automateService.automate({ task, ...options });
    return this.ok(res, result);
  }

  /**
   * fetch - Asynchronously executes fetch.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async fetch(req, res) {
    const result = await this.fetchService.fetchUrl(req.body);
    return res.status(result.status || 200).json(result);
  }
}

module.exports = WebController;
