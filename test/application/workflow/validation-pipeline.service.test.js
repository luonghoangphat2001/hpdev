'use strict';

const ValidationPipelineService = require('../../../src/application/services/workflow/validation-pipeline.service');

describe('T156: Validation/Lint/Contract/Security Pipeline Service', () => {
  test('runs complete validation pipeline on draft code and passes', async () => {
    const service = new ValidationPipelineService();
    const res = await service.runValidationPipeline({ draftId: 'draft_101', codeContent: 'module.exports = {};' });

    expect(res.overallPipelinePassed).toBe(true);
    expect(res.securityCheckPassed).toBe(true);
    expect(res.contractCheckPassed).toBe(true);
  });
});
