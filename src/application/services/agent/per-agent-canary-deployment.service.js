'use strict';

class PerAgentCanaryDeploymentService {
  startCanaryDeployment({ agentId, canaryRatioPercent = 10, targetVersion }) {
    const deploymentId = `canary_${agentId}_${Math.random().toString(36).substr(2, 7)}`;

    return Object.freeze({
      deploymentId,
      agentId,
      canaryRatioPercent,
      targetVersion,
      status: 'CANARY_RUNNING',
      metricsBaselineMet: true,
      autoStopTriggered: false,
      startedAt: new Date().toISOString(),
    });
  }
}

module.exports = PerAgentCanaryDeploymentService;
