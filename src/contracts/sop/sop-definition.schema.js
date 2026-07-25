'use strict';

module.exports = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://openclaw.hpdev.name.vn/schemas/v1/sop-definition.json',
  type: 'object',
  additionalProperties: false,
  required: ['name', 'steps'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 500 },
    description: { type: 'string', maxLength: 2000 },
    steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'preconditions', 'expectedOutput'],
        properties: {
          id: { type: 'string', minLength: 1, maxLength: 128 },
          name: { type: 'string', minLength: 1, maxLength: 500 },
          preconditions: { type: 'array', items: { type: 'string' } },
          expectedOutput: { type: 'object' },
          dependsOn: { type: 'array', uniqueItems: true, items: { type: 'string' } },
          capability: { type: 'string' },
        },
      },
    },
  },
});
