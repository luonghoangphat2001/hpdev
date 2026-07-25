'use strict';

class GitVersionControlAdapterService {
  async getCommitDetails(ref = 'HEAD') {
    return Object.freeze({
      commitHash: 'a1b2c3d4e5f6',
      branch: 'main',
      author: 'CEO <ceo@dan.ai>',
      checksum: 'sha256_mock_checksum',
      rollbackRef: 'v1.3.9',
      retrievedAt: new Date().toISOString(),
    });
  }
}

module.exports = GitVersionControlAdapterService;
