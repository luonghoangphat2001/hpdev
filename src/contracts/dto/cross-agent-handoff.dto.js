'use strict';

const crossAgentHandoffSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://openclaw.hpdev.name.vn/schemas/v1/cross-agent-handoff.json',
  type: 'object',
  additionalProperties: false,
  required: [
    'handoffId',
    'sourceAgent',
    'targetAgent',
    'workflowId',
    'contextRefs',
    'payload',
    'expectedResult',
    'deadlineAt',
    'createdAt',
  ],
  properties: {
    handoffId: { type: 'string', minLength: 1, maxLength: 128 },
    sourceAgent: { type: 'string', minLength: 1, maxLength: 128 },
    targetAgent: { type: 'string', minLength: 1, maxLength: 128 },
    workflowId: { type: 'string', minLength: 1, maxLength: 128 },
    contextRefs: { type: 'array', items: { type: 'string' } },
    payload: { type: 'object' },
    expectedResult: { type: 'string', minLength: 1 },
    deadlineAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
  },
});

function createCrossAgentHandoffDto({
  handoffId,
  sourceAgent,
  targetAgent,
  workflowId,
  contextRefs = [],
  payload = {},
  expectedResult,
  deadlineAt,
  createdAt = new Date().toISOString(),
}) {
  if (!handoffId || !sourceAgent || !targetAgent || !workflowId || !expectedResult || !deadlineAt) {
    throw new Error('Missing required fields for CrossAgentHandoff DTO');
  }

  return Object.freeze({
    handoffId,
    sourceAgent,
    targetAgent,
    workflowId,
    contextRefs: Object.freeze([...contextRefs]),
    payload: Object.freeze({ ...payload }),
    expectedResult,
    deadlineAt,
    createdAt,
  });
}

module.exports = {
  crossAgentHandoffSchema,
  createCrossAgentHandoffDto,
};
