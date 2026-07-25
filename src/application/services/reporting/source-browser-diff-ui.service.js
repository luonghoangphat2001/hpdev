'use strict';

class SourceBrowserDiffUiService {
  constructor({ gitAdapterService }) {
    this.gitAdapterService = gitAdapterService;
  }

  async getSanitizedSource({ agentId, filePath }) {
    return Object.freeze({
      agentId,
      filePath,
      content: '// Redacted agent code - secrets scrubbed',
      sanitized: true,
      retrievedAt: new Date().toISOString(),
    });
  }

  async getSourceDiff({ agentId, refA, refB }) {
    return Object.freeze({
      agentId,
      refA,
      refB,
      diffText: `--- a/${agentId}/prompt.txt\n+++ b/${agentId}/prompt.txt\n@@ -1 +1 @@\n-v1 prompt\n+v2 prompt`,
      diffGeneratedAt: new Date().toISOString(),
    });
  }
}

module.exports = SourceBrowserDiffUiService;
