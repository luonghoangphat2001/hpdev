/**
 * @fileoverview automate.validation - Provides automate.validation functionality.
 */
'use strict';

const AppError = require('@utils/errors/app.error');

/**
 * AutomateValidation
 * Manages automate validation logic.
 */
class AutomateValidation {
  /**
   * validateAutomate - Executes validate automate.
   * @param {*} payload - Input parameter.
   * @returns {*} Result of operation.
   */
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
