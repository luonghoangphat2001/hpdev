'use strict';

class LiveActivityPanelService {
  getLiveActivity({ agentId, currentStep, summaryReason, activeTool, activeModel, nextStep }) {
    return Object.freeze({
      agentId,
      currentStep,
      summaryReason,
      activeTool: activeTool || 'NONE',
      activeModel: activeModel || 'gemini-3.6-flash',
      nextStep: nextStep || 'COMPLETE',
      updatedAt: new Date().toISOString(),
    });
  }
}

module.exports = LiveActivityPanelService;
