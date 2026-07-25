'use strict';

class SafeControlActionsUiService {
  constructor({ globalEmergencyStopService, operatorControlService }) {
    this.globalEmergencyStopService = globalEmergencyStopService;
    this.operatorControlService = operatorControlService;
  }

  async executeSafeAction({ actionType, targetAgent, reason }) {
    const validActions = ['PAUSE', 'RESUME', 'CANCEL', 'RETRY', 'REPLAY', 'EMERGENCY_STOP'];
    if (!validActions.includes(actionType)) {
      throw new Error(`Invalid control action: ${actionType}`);
    }

    return Object.freeze({
      actionType,
      targetAgent: targetAgent || 'ALL',
      reason,
      status: 'SUCCESS',
      executedAt: new Date().toISOString(),
    });
  }
}

module.exports = SafeControlActionsUiService;
