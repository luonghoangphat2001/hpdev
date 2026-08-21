'use strict';

const { createModelDisclosureMetadata } = require('../../src/schemas/ai/model.metadata');

describe('T087: Model Disclosure Metadata', () => {
  test('creates valid frozen disclosure metadata', () => {
    const meta = createModelDisclosureMetadata({
      model: 'gemini-3.6-flash',
      provider: 'google',
      promptVersion: 'v2.1',
      toolsUsed: ['ssot_inventory'],
    });

    expect(meta.model).toBe('gemini-3.6-flash');
    expect(meta.toolsUsed).toContain('ssot_inventory');
    expect(Object.isFrozen(meta)).toBe(true);
  });
});
