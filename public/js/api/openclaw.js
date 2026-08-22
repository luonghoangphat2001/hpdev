import { requestJson, sendJson } from './request.js';

export function get(url) {
  return requestJson(url);
}

export function controlAgent(agentId, toState, expectedVersion, reason) {
  const encodedAgentId = encodeURIComponent(agentId);

  return sendJson(`/api/openclaw/agents/${encodedAgentId}/control`, 'POST', {
    toState,
    expectedVersion,
    reason,
  });
}
