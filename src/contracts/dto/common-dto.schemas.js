'use strict';

const DTO_SCHEMA_VERSION = '1.0.0';
const SCHEMA_BASE_URI = 'https://openclaw.hpdev.name.vn/schemas/v1';

const id = {
  type: 'string',
  minLength: 1,
  maxLength: 128,
};

const timestamp = {
  type: 'string',
  format: 'date-time',
};

const jsonObject = {
  type: 'object',
};

function createSchema(name, required, properties) {
  return Object.freeze({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${SCHEMA_BASE_URI}/${name}.json`,
    title: name,
    type: 'object',
    additionalProperties: false,
    required: Object.freeze(['schema_version', ...required]),
    properties: Object.freeze({
      schema_version: { const: DTO_SCHEMA_VERSION },
      ...properties,
    }),
  });
}

const eventSchema = createSchema('event-dto', [
  'event_id',
  'event_type',
  'occurred_at',
  'source',
  'payload',
], {
  event_id: id,
  event_type: id,
  occurred_at: timestamp,
  source: {
    type: 'string',
    enum: ['ecommerce', 'openclaw', 'dan_ai'],
  },
  correlation_id: id,
  payload: jsonObject,
});

const workflowSchema = createSchema('workflow-dto', [
  'workflow_id',
  'workflow_type',
  'status',
  'risk_level',
  'created_at',
  'updated_at',
], {
  workflow_id: id,
  workflow_type: id,
  event_id: id,
  correlation_id: id,
  assigned_agent: id,
  status: {
    type: 'string',
    enum: [
      'received',
      'queued',
      'running',
      'awaiting_approval',
      'completed',
      'failed',
      'cancelled',
    ],
  },
  risk_level: {
    type: 'string',
    enum: ['low', 'medium', 'high', 'critical'],
  },
  context: jsonObject,
  created_at: timestamp,
  updated_at: timestamp,
});

const agentSchema = createSchema('agent-task-dto', [
  'agent_id',
  'workflow_id',
  'task_id',
  'status',
  'input',
], {
  agent_id: id,
  workflow_id: id,
  task_id: id,
  parent_task_id: id,
  status: {
    type: 'string',
    enum: ['queued', 'running', 'completed', 'failed', 'blocked'],
  },
  capabilities: {
    type: 'array',
    uniqueItems: true,
    items: id,
  },
  input: jsonObject,
  output: jsonObject,
  error: {
    type: ['object', 'null'],
  },
  started_at: {
    type: ['string', 'null'],
    format: 'date-time',
  },
  completed_at: {
    type: ['string', 'null'],
    format: 'date-time',
  },
});

const approvalSchema = createSchema('approval-dto', [
  'approval_id',
  'workflow_id',
  'action_id',
  'status',
  'risk_level',
  'payload_hash',
  'requested_at',
  'expires_at',
], {
  approval_id: id,
  workflow_id: id,
  action_id: id,
  status: {
    type: 'string',
    enum: ['pending', 'approved', 'rejected', 'expired', 'consumed'],
  },
  risk_level: {
    type: 'string',
    enum: ['medium', 'high', 'critical'],
  },
  payload_hash: {
    type: 'string',
    pattern: '^[a-f0-9]{64}$',
  },
  requested_by: id,
  decided_by: {
    type: ['string', 'null'],
  },
  decision_reason: {
    type: ['string', 'null'],
    maxLength: 2000,
  },
  requested_at: timestamp,
  expires_at: timestamp,
  decided_at: {
    type: ['string', 'null'],
    format: 'date-time',
  },
});

const reportSchema = createSchema('agent-report-dto', [
  'report_id',
  'agent_id',
  'period',
  'status',
  'metrics',
  'generated_at',
], {
  report_id: id,
  agent_id: id,
  workflow_id: id,
  period: {
    type: 'object',
    additionalProperties: false,
    required: ['start', 'end', 'timezone'],
    properties: {
      start: timestamp,
      end: timestamp,
      timezone: {
        type: 'string',
        minLength: 1,
        maxLength: 64,
      },
    },
  },
  status: {
    type: 'string',
    enum: ['complete', 'partial', 'failed'],
  },
  metrics: jsonObject,
  highlights: {
    type: 'array',
    items: { type: 'string' },
  },
  exceptions: {
    type: 'array',
    items: jsonObject,
  },
  source_refs: {
    type: 'array',
    uniqueItems: true,
    items: id,
  },
  generated_at: timestamp,
});

const COMMON_DTO_SCHEMAS = Object.freeze([
  eventSchema,
  workflowSchema,
  agentSchema,
  approvalSchema,
  reportSchema,
]);

module.exports = {
  DTO_SCHEMA_VERSION,
  SCHEMA_BASE_URI,
  COMMON_DTO_SCHEMAS,
  eventSchema,
  workflowSchema,
  agentSchema,
  approvalSchema,
  reportSchema,
};
