'use strict';

class AgentSourcePackageManifestService {
  getPackageManifest(agentId) {
    return Object.freeze({
      agentId,
      activeVersion: 'v1.4.0',
      manifestMap: Object.freeze({
        code: `src/application/agents/${agentId}.agent.js`,
        prompt: `src/prompts/${agentId}.prompt.txt`,
        sop: `config/sops/${agentId}.sop.json`,
        policy: `config/policies/${agentId}.policy.json`,
        tools: Object.freeze(['ssot_client', 'kpi_collector']),
        model: 'gemini-3.6-flash',
      }),
      manifestCreatedAt: new Date().toISOString(),
    });
  }
}

module.exports = AgentSourcePackageManifestService;
