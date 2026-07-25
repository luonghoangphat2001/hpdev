'use strict';

const GitVersionControlAdapterService = require('../../../src/application/services/devops/git-version-control-adapter.service');

describe('T152: Git/Version-Control Adapter Service', () => {
  test('returns commit details, checksum, and rollback ref', async () => {
    const adapter = new GitVersionControlAdapterService();
    const details = await adapter.getCommitDetails();

    expect(details.commitHash).toBeDefined();
    expect(details.branch).toBe('main');
    expect(details.rollbackRef).toBe('v1.3.9');
  });
});
