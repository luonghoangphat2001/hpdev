/**
 * @fileoverview crawl.validation - Provides crawl.validation functionality.
 */
'use strict';

const AppError = require('@utils/errors/app.error');

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

const validator = new CrawlValidation();

function validateCrawl(req, res, next) {
  try {
    const payload = req && req.body ? req.body : req;
    const validated = validator.validateCrawl(payload);
    if (req && req.body) {
      req.body = { ...req.body, ...validated };
    }
    if (typeof next === 'function') {
      return next();
    }
    return validated;
  } catch (err) {
    if (typeof next === 'function') {
      return next(err);
    }
    throw err;
  }
}

validateCrawl.CrawlValidation = CrawlValidation;
validateCrawl.validateCrawl = validator.validateCrawl.bind(validator);

module.exports = validateCrawl;
