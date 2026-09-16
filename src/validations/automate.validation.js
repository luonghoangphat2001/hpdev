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

const validator = new AutomateValidation();

function validateAutomate(req, res, next) {
  try {
    const payload = req && req.body ? req.body : req;
    const validated = validator.validateAutomate(payload);
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

validateAutomate.AutomateValidation = AutomateValidation;
validateAutomate.validateAutomate = validator.validateAutomate.bind(validator);

module.exports = validateAutomate;
