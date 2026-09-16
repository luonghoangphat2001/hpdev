/**
 * @fileoverview fetch.validation - Provides fetch.validation functionality.
 */
'use strict';

const AppError = require('@utils/errors/app.error');

/**
 * FetchValidation
 * Manages fetch validation logic.
 */
class FetchValidation {
  /**
   * validateFetch - Executes validate fetch.
   * @param {*} payload - Input parameter.
   * @returns {*} Result of operation.
   */
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

const validator = new FetchValidation();

function validateFetch(req, res, next) {
  try {
    const payload = req && req.body ? req.body : req;
    const validated = validator.validateFetch(payload);
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

validateFetch.FetchValidation = FetchValidation;
validateFetch.validateFetch = validator.validateFetch.bind(validator);

module.exports = validateFetch;
