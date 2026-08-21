/**
 * @fileoverview http-metrics.middleware - Provides http-metrics functionality.
 */
'use strict';

/**
 * HttpMetricsMiddleware
 * Manages http metrics logic.
 */
class HttpMetricsMiddleware {
  constructor({ registry, clock = () => Date.now() }) {
    this.registry = registry;
    this.clock = clock;
  }

  /**
   * handle - Executes handle.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} [next] - Express next middleware function.
   * @returns {*} Result of operation.
   */
  handle(req, res, next) {
    const startedAt = this.clock();
    res.once('finish', () => {
      const labels = {
        method: req.method,
        route: req.route?.path || req.path || 'unknown',
        status: String(res.statusCode),
      };
      this.registry.increment('http_requests_total', labels);
      this.registry.observe(
        'http_request_duration_ms',
        Math.max(0, this.clock() - startedAt),
        labels,
      );
    });
    next();
  }
}

module.exports = HttpMetricsMiddleware;
