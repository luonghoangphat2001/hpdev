/**
 * @fileoverview BaseSchema - Provides base schema functionality.
 */
"use strict";

const env = require("@config/config");

const DTO_SCHEMA_VERSION = "1.0.0";

const id = Object.freeze({
  type: "string",
  minLength: 1,
  maxLength: 128,
});

const flexibleId = Object.freeze({
  type: ["string", "integer"],
  minLength: 1,
});

const timestamp = Object.freeze({
  type: "string",
  format: "date-time",
});

const date = Object.freeze({
  type: "string",
  format: "date",
});

const jsonObject = Object.freeze({
  type: "object",
});

const reason = Object.freeze({
  type: "string",
  minLength: 1,
  maxLength: 2000,
});

const pagination = Object.freeze({
  page: { type: "integer", minimum: 1 },
  per_page: { type: "integer", minimum: 1, maximum: 100 },
});

/**
 * BaseSchema provides the baseline for all JSON Schema contracts and DTO primitives in OpenClaw.
 * Encapsulates environment-driven $schema specification, $id URI generation,
 * shared primitive data types, and standardized immutable schema definitions.
 */
class BaseSchema {
  static get DRAFT_URI() {
    return env.jsonSchemaDraftUrl;
  }

  static get BASE_URI() {
    return env.schemaBaseUrl;
  }

  static get DTO_SCHEMA_VERSION() {
    return DTO_SCHEMA_VERSION;
  }

  static get types() {
    return {
      id,
      flexibleId,
      timestamp,
      date,
      jsonObject,
      reason,
      pagination,
    };
  }

  /**
   * Builds a fully-qualified Schema $id URI from relative path.
   * @param {string} relativePath e.g. "agent-profile.json" or "commands/pause.json"
   * @returns {string}
   */
  static uri(relativePath) {
    const cleanPath = String(relativePath || "").replace(/^\/+/, "");
    return `${this.BASE_URI}/${cleanPath}`;
  }

  /**
   * Factory method to create a standardized, immutable JSON Schema.
   * @param {Object} def
   * @returns {Object}
   */
  static create(def = {}) {
    const { id: explicitId, path, title, description, type = "object", properties = {}, required = [], additionalProperties = false, ...rest } = def;

    const schemaId = explicitId || (path ? this.uri(path) : undefined);

    return Object.freeze({
      $schema: this.DRAFT_URI,
      ...(schemaId ? { $id: schemaId } : {}),
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      type,
      properties,
      required,
      additionalProperties,
      ...rest,
    });
  }

  /**
   * Factory method to create a standardized DTO Schema with versioning.
   * @param {string} name
   * @param {Array<string>} required
   * @param {Object} properties
   * @returns {Object}
   */
  static createDto(name, required = [], properties = {}) {
    return this.create({
      path: `${name}.json`,
      title: name,
      type: "object",
      additionalProperties: false,
      required: Object.freeze(["schema_version", ...required]),
      properties: Object.freeze({
        schema_version: { const: DTO_SCHEMA_VERSION },
        ...properties,
      }),
    });
  }
}

// Pre-define core shared contracts right in BaseSchema
const eventSchema = BaseSchema.createDto("event-dto", [
  "event_id",
  "event_type",
  "occurred_at",
  "source",
  "payload",
], {
  event_id: id,
  event_type: id,
  occurred_at: timestamp,
  source: {
    type: "string",
    enum: ["ecommerce", "openclaw", "dan_ai"],
  },
  correlation_id: id,
  payload: jsonObject,
});

const workflowSchema = BaseSchema.createDto("workflow-dto", [
  "workflow_id",
  "workflow_type",
  "status",
  "risk_level",
  "created_at",
  "updated_at",
], {
  workflow_id: id,
  workflow_type: id,
  event_id: id,
  correlation_id: id,
  assigned_agent: id,
  status: {
    type: "string",
    enum: [
      "received",
      "queued",
      "running",
      "awaiting_approval",
      "completed",
      "failed",
      "cancelled",
    ],
  },
  risk_level: {
    type: "string",
    enum: ["low", "medium", "high", "critical"],
  },
  context: jsonObject,
  created_at: timestamp,
  updated_at: timestamp,
});

const agentSchema = BaseSchema.createDto("agent-task-dto", [
  "agent_id",
  "workflow_id",
  "task_id",
  "status",
  "input",
], {
  agent_id: id,
  workflow_id: id,
  task_id: id,
  parent_task_id: id,
  status: {
    type: "string",
    enum: ["queued", "running", "completed", "failed", "blocked"],
  },
  capabilities: {
    type: "array",
    uniqueItems: true,
    items: id,
  },
  input: jsonObject,
  output: jsonObject,
  error: {
    type: ["object", "null"],
  },
  started_at: {
    type: ["string", "null"],
    format: "date-time",
  },
  completed_at: {
    type: ["string", "null"],
    format: "date-time",
  },
});

const approvalSchema = BaseSchema.createDto("approval-dto", [
  "approval_id",
  "workflow_id",
  "action_id",
  "status",
  "risk_level",
  "payload_hash",
  "requested_at",
  "expires_at",
], {
  approval_id: id,
  workflow_id: id,
  action_id: id,
  status: {
    type: "string",
    enum: ["pending", "approved", "rejected", "expired", "consumed"],
  },
  risk_level: {
    type: "string",
    enum: ["medium", "high", "critical"],
  },
  payload_hash: {
    type: "string",
    pattern: "^[a-f0-9]{64}$",
  },
  requested_by: id,
  decided_by: {
    type: ["string", "null"],
  },
  decision_reason: {
    type: ["string", "null"],
    maxLength: 2000,
  },
  requested_at: timestamp,
  expires_at: timestamp,
  decided_at: {
    type: ["string", "null"],
    format: "date-time",
  },
});

const reportSchema = BaseSchema.createDto("agent-report-dto", [
  "report_id",
  "agent_id",
  "period",
  "status",
  "metrics",
  "generated_at",
], {
  report_id: id,
  agent_id: id,
  workflow_id: id,
  period: {
    type: "object",
    additionalProperties: false,
    required: ["start", "end", "timezone"],
    properties: {
      start: timestamp,
      end: timestamp,
      timezone: {
        type: "string",
        minLength: 1,
        maxLength: 64,
      },
    },
  },
  status: {
    type: "string",
    enum: ["complete", "partial", "failed"],
  },
  metrics: jsonObject,
  highlights: {
    type: "array",
    items: { type: "string" },
  },
  exceptions: {
    type: "array",
    items: jsonObject,
  },
  source_refs: {
    type: "array",
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

BaseSchema.COMMON_DTO_SCHEMAS = COMMON_DTO_SCHEMAS;
BaseSchema.eventSchema = eventSchema;
BaseSchema.workflowSchema = workflowSchema;
BaseSchema.agentSchema = agentSchema;
BaseSchema.approvalSchema = approvalSchema;
BaseSchema.reportSchema = reportSchema;

module.exports = BaseSchema;
