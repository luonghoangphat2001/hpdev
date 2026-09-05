'use strict';

const ApiResponse = require('@utils/ApiResponse');

function configureErrorHandlers(app) {
  app.use((_req, res) => ApiResponse.notFound(res, 'Not found'));
  app.use((err, req, res, next) => {
    console.error('[HTTP] Unhandled error:', err);
    if (res.headersSent) return next(err);

    const status = Number.isInteger(err.statusCode) && err.statusCode >= 400
      ? err.statusCode
      : 500;
    const message = status === 500 ? 'Internal server error' : (err.message ? err.message : 'Request failed');

    return ApiResponse.error(res, message, status);
  });
}

module.exports = configureErrorHandlers;
