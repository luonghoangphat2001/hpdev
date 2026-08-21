/**
 * @fileoverview log-viewer.service - Provides log-viewer functionality.
 */
'use strict';

/**
 * LogViewerService
 * Manages log viewer logic.
 */
class LogViewerService {
  /**
   * constructor - Executes constructor.
   * @param {*} authorizedStreamApi - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ authorizedStreamApi }) {
    this.authorizedStreamApi = authorizedStreamApi;
  }

  /**
   * getViewerState - Executes get viewer state.
   * @param {*} agentId - Input parameter.
   * @param {*} filterTerm - Input parameter.
   * @param {*} paused - Input parameter.
   * @returns {*} Result of operation.
   */
  getViewerState({ agentId, filterTerm = '', paused = false }) {
    return Object.freeze({
      agentId,
      filterTerm,
      paused,
      liveTailActive: !paused,
      exportSupported: true,
      workflowDeepLinkPattern: `/workflows/:workflowId`,
      retrievedAt: new Date().toISOString(),
    });
  }
}

module.exports = LogViewerService;
