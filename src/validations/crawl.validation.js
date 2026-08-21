/**
 * @fileoverview crawl.validation - Provides crawl.validation functionality.
 */
'use strict';

const AppError = require('../utils/errors/app.error');

/**
 * CrawlValidation
 * Manages crawl validation logic.
 */
class CrawlValidation {
  /**
   * validateCrawl - Executes validate crawl.
   * @param {*} payload - Input parameter.
   * @returns {*} Result of operation.
   */
  validateCrawl(payload = {}) {
    if (!payload.url) {
      throw new AppError('url is required', 400);
    }

    return {
      url: payload.url,
    };
  }
}

module.exports = CrawlValidation;
