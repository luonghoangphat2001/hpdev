'use strict';

const PatchEditorService = require('../../../src/services/ai/critics/patch-editor.service');

describe('T155: Executable-Code Patch Editor Service', () => {
  test('creates isolated patch branch without writing directly to production files', () => {
    const service = new PatchEditorService();
    const patch = service.createCodePatchBranch({
      agentId: 'dan_rnd',
      patchContent: 'diff --git a/file.js b/file.js',
      targetFile: 'src/services/ai/agents/rnd.agent.js',
    });

    expect(patch.isProductionDirectWrite).toBe(false);
    expect(patch.branchName).toContain('patch_dan_rnd_');
  });
});
