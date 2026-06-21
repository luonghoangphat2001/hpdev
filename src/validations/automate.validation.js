'use strict';

const { AppError } = require('../middlewares/error.middleware');

class AutomateValidation {
  validateAutomate(payload = {}) {
    if (!payload.url) {
      throw new AppError('url is required', 400);
    }

    return {
      url: payload.url,
      steps: Array.isArray(payload.steps) ? payload.steps : [],
      screenshot: Boolean(payload.screenshot),
    };
  }
}

module.exports = AutomateValidation;
