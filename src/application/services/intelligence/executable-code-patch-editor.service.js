'use strict';

class ExecutableCodePatchEditorService {
  createCodePatchBranch({ agentId, patchContent, targetFile }) {
    const branchName = `patch_${agentId}_${Math.random().toString(36).substr(2, 7)}`;

    return Object.freeze({
      agentId,
      targetFile,
      branchName,
      patchContent,
      isProductionDirectWrite: false,
      patchCreatedAt: new Date().toISOString(),
    });
  }
}

module.exports = ExecutableCodePatchEditorService;
