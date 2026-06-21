'use strict';

const { AppError } = require('../middlewares/error.middleware');

class FetchValidation {
  validateFetch(payload = {}) {
    if (!payload.url) {
      throw new AppError('url is required', 400);
    }

    return {
      url: payload.url,
      method: payload.method || 'GET',
      headers: payload.headers || {},
      data: payload.data,
    };
  }
}

module.exports = FetchValidation;
