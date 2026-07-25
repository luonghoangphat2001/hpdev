'use strict';

const AgentSourcePackageManifestService = require('../../src/application/services/agent-source-package-manifest.service');

describe('T151: Agent Source-Package Manifest Service', () => {
  test('returns package manifest for target agent', () => {
    const service = new AgentSourcePackageManifestService();
    const manifest = service.getPackageManifest('dan_cfo');

    expect(manifest.agentId).toBe('dan_cfo');
    expect(manifest.activeVersion).toBe('v1.4.0');
    expect(manifest.manifestMap.model).toBe('gemini-3.6-flash');
  });
});
