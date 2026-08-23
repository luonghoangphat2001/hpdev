'use strict';

function configureErrorHandlers(app) {
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err, req, res, next) => {
    console.error('[HTTP] Unhandled error:', err);
    if (res.headersSent) return next(err);

    const status = Number.isInteger(err.statusCode) && err.statusCode >= 400
      ? err.statusCode
      : 500;
    const message = status === 500 ? 'Internal server error' : (err.message || 'Request failed');

    return res.status(status).json({ error: message });
  });
}

module.exports = configureErrorHandlers;
