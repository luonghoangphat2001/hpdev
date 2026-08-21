'use strict';

const BrowserDiffUiService = require('../../../src/services/reporting/daily/browser-diff-ui.service');

describe('T153: Source Browser and Diff API/UI Service', () => {
  test('returns sanitized source code and branch/commit diffs', async () => {
    const service = new BrowserDiffUiService({});

    const source = await service.getSanitizedSource({ agentId: 'dan_cfo', filePath: 'src/prompts/cfo.txt' });
    expect(source.sanitized).toBe(true);

    const diff = await service.getSourceDiff({ agentId: 'dan_cfo', refA: 'v1.0', refB: 'v1.1' });
    expect(diff.diffText).toContain('+v2 prompt');
  });
});
