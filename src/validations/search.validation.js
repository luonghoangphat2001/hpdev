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

const validator = new SearchValidation();

/**
 * Express middleware for search validation.
 * Supports both direct execution and Express middleware signature.
 */
function validateSearch(req, res, next) {
  try {
    const payload = req && req.body ? req.body : req;
    const validated = validator.validateSearch(payload);
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

validateSearch.SearchValidation = SearchValidation;
validateSearch.validateSearch = validator.validateSearch.bind(validator);

module.exports = validateSearch;
