/**
 * @fileoverview error.middleware - Provides error functionality.
 */
'use strict';

const logger = require('../utils/logger.service');
const AppError = require('../utils/errors/app.error');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || err.response?.status || 500;
  const payload = { error: err.message || 'Internal server error' };

  logger.error(payload.error, {
    statusCode,
    error: logger.formatError(err),
  });

  if (err.details) {
    payload.details = err.details;
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  AppError,
  asyncHandler,
  notFoundHandler,
  errorHandler,
};
