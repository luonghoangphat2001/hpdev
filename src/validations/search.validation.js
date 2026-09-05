/**
 * @fileoverview search.validation - Provides search.validation functionality.
 */
'use strict';

const AppError = require('@utils/errors/app.error');

/**
 * SearchValidation
 * Manages search validation logic.
 */
class SearchValidation {
  /**
   * validateSearch - Executes validate search.
   * @param {*} payload - Input parameter.
   * @returns {*} Result of operation.
   */
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
