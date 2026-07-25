'use strict';

class AuthorizedRealtimeStreamApiService {
  constructor({ centralPermissionEvaluator, realtimeActivityTransport }) {
    this.centralPermissionEvaluator = centralPermissionEvaluator;
    this.realtimeActivityTransport = realtimeActivityTransport;
  }

  createStreamSession({ userRole, agentId, cursor }) {
    if (this.centralPermissionEvaluator) {
      const auth = this.centralPermissionEvaluator.canExecuteAction({ subjectRole: userRole, action: 'VIEW_STREAM', resource: agentId });
      if (!auth.allowed) {
        throw new Error(`Unauthorized log stream access for role: ${userRole}`);
      }
    }

    return Object.freeze({
      streamId: `stream_${agentId}_${Math.random().toString(36).substr(2, 7)}`,
      userRole,
      agentId,
      cursor: cursor || '0',
      redactionActive: true,
      status: 'STREAM_CONNECTED',
      connectedAt: new Date().toISOString(),
    });
  }
}

module.exports = AuthorizedRealtimeStreamApiService;
