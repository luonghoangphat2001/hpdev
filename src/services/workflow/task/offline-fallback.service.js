/**
 * @fileoverview offline-fallback.service - Provides offline-fallback functionality.
 */
'use strict';

/**
 * OfflineFallbackService
 * Manages offline fallback logic.
 */
class OfflineFallbackService {
  /**
   * executeSimpleRule - Executes execute simple rule.
   * @param {*} taskType - Input parameter.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
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
