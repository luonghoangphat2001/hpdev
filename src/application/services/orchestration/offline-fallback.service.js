'use strict';

class OfflineFallbackService {
  executeSimpleRule({ taskType, data = {} }) {
    switch (taskType) {
      case 'daily_summary':
        return Object.freeze({
          offlineFallback: true,
          summary: `Offline fallback summary for ${data.date || 'today'}`,
        });
      case 'stock_check':
        return Object.freeze({
          offlineFallback: true,
          status: 'CHECK_MANUALLY',
        });
      default:
        return Object.freeze({
          offlineFallback: true,
          status: 'UNSUPPORTED_OFFLINE_TASK',
        });
    }
  }
}

module.exports = OfflineFallbackService;
