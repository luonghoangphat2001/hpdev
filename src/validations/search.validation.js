'use strict';

const { AppError } = require('../middlewares/error.middleware');

class SearchValidation {
  validateSearch(payload = {}) {
    if (!payload.query) {
      throw new AppError('query is required', 400);
    }

    return {
      query: payload.query,
      num: payload.num ?? 5,
    };
  }
}

module.exports = SearchValidation;
