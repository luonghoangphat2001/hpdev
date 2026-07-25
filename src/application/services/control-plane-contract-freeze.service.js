'use strict';

class ControlPlaneContractFreezeService {
  getFrozenContractSpec() {
    return Object.freeze({
      version: '1.0.0-FROZEN',
      readEndpoints: Object.freeze(['/api/overview', '/api/agents', '/api/workflows', '/api/queue', '/api/cost']),
      controlEndpoints: Object.freeze(['/api/emergency-stop', '/api/approval-decision', '/api/feature-flag']),
      realtimeEvents: Object.freeze(['workflow_state_changed', 'agent_status_changed', 'alert_triggered']),
      permissionScopes: Object.freeze(['CEO_FULL_CONTROL', 'OPERATOR_MANUAL_OVERRIDE', 'READ_ONLY_ANALYTICS']),
      frozenAt: new Date().toISOString(),
    });
  }
}

module.exports = ControlPlaneContractFreezeService;
