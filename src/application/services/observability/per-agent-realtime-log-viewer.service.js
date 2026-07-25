'use strict';

class PerAgentRealtimeLogViewerService {
  constructor({ authorizedStreamApi }) {
    this.authorizedStreamApi = authorizedStreamApi;
  }

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

module.exports = PerAgentRealtimeLogViewerService;
