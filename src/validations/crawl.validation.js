'use strict';

const { AppError } = require('../middlewares/error.middleware');

class CrawlValidation {
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
