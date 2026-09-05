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

module.exports = FetchValidation;
