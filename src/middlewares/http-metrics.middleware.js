'use strict';

class HttpMetricsMiddleware {
  constructor({ registry, clock = () => Date.now() }) {
    this.registry = registry;
    this.clock = clock;
  }

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
