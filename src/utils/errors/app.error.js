/**
 * @fileoverview app.error - Provides app.error functionality.
 */
'use strict';

/**
 * AppError
 * Manages app error logic.
 */
class AppError extends Error {
  /**
   * constructor - Executes constructor.
   * @param {*} message - Input parameter.
   * @param {*} statusCode - Input parameter.
   * @param {*} details - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = AppError;
