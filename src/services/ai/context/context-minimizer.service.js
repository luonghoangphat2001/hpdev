/**
 * @fileoverview context-minimizer.service - Provides context-minimizer functionality.
 */
'use strict';

/**
 * ContextMinimizerService
 * Manages context minimizer logic.
 */
class ContextMinimizerService {
  /**
   * minimizeContext - Executes minimize context.
   * @param {*} fullContextData - Input parameter.
   * @param {*} tokenCeiling - Input parameter.
   * @returns {*} Result of operation.
   */
  minimizeContext({ fullContextData, tokenCeiling = 2000 }) {
    const fieldsToKeep = Object.keys(fullContextData || {}).slice(0, 3);
    const minified = {};
    fieldsToKeep.forEach((k) => { minified[k] = fullContextData[k]; });

    return Object.freeze({
      minifiedContext: minified,
      tokenCeiling,
      summaryVersion: 'v1.0',
      minifiedAt: new Date().toISOString(),
    });
  }
}

module.exports = ContextMinimizerService;
