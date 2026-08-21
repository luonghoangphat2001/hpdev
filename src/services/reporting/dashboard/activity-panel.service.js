/**
 * @fileoverview activity-panel.service - Provides activity-panel functionality.
 */
'use strict';

/**
 * ActivityPanelService
 * Manages activity panel logic.
 */
class ActivityPanelService {
  /**
   * getLiveActivity - Executes get live activity.
   * @param {*} agentId - Input parameter.
   * @param {*} currentStep - Input parameter.
   * @param {*} summaryReason - Input parameter.
   * @param {*} activeTool - Input parameter.
   * @param {*} activeModel - Input parameter.
   * @param {*} nextStep - Input parameter.
   * @returns {*} Result of operation.
   */
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

module.exports = ActivityPanelService;
