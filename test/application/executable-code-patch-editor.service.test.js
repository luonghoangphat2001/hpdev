'use strict';

const ExecutableCodePatchEditorService = require('../../src/application/services/executable-code-patch-editor.service');

describe('T155: Executable-Code Patch Editor Service', () => {
  test('creates isolated patch branch without writing directly to production files', () => {
    const service = new ExecutableCodePatchEditorService();
    const patch = service.createCodePatchBranch({
      agentId: 'dan_rnd',
      patchContent: 'diff --git a/file.js b/file.js',
      targetFile: 'src/application/agents/rnd.agent.js',
    });

    expect(patch.isProductionDirectWrite).toBe(false);
    expect(patch.branchName).toContain('patch_dan_rnd_');
  });
});
