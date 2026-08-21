'use strict';

const SchemaDocGenService = require('../../../src/services/reporting/dashboard/schema-doc-gen.service');

describe('T114: API/Schema Documentation Generator Service', () => {
  test('generates API doc payload with compatibility matrix', () => {
    const generator = new SchemaDocGenService();
    const docs = generator.generateDocs();

    expect(docs.version).toBe('1.0.0');
    expect(docs.events).toContain('order.created');
    expect(docs.compatibilityMatrix.ssotVersion).toBe('v2.4');
  });
});
