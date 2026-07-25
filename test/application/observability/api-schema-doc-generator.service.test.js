'use strict';

const ApiSchemaDocGeneratorService = require('../../../src/application/services/observability/api-schema-doc-generator.service');

describe('T114: API/Schema Documentation Generator Service', () => {
  test('generates API doc payload with compatibility matrix', () => {
    const generator = new ApiSchemaDocGeneratorService();
    const docs = generator.generateDocs();

    expect(docs.version).toBe('1.0.0');
    expect(docs.events).toContain('order.created');
    expect(docs.compatibilityMatrix.ssotVersion).toBe('v2.4');
  });
});
