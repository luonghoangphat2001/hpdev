/**
 * @fileoverview sop.schema - Provides sop functionality.
 */
"use strict";

const BaseSchema = require("@schemas/BaseSchema");

const sopDefinitionSchema = BaseSchema.create({
  path: "sop-definition.json",
  title: "SOP Definition",
  description: "Schema defining structured multi-step standard operating procedures",
  type: "object",
  required: ["sopId", "title", "version", "domain", "steps"],
  properties: {
    sopId: { type: "string", minLength: 3 },
    title: { type: "string", minLength: 3 },
    version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
    domain: { type: "string", enum: ["cskh", "rnd", "ops", "logistics", "cfo", "general"] },
    description: { type: "string" },
    triggerEvents: {
      type: "array",
      items: { type: "string" },
    },
    steps: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["stepId", "action", "order"],
        properties: {
          stepId: { type: "string" },
          order: { type: "integer", minimum: 1 },
          action: { type: "string" },
          params: { type: "object" },
          timeoutMs: { type: "integer", minimum: 100 },
          retryPolicy: {
            type: "object",
            properties: {
              maxAttempts: { type: "integer", minimum: 1 },
              backoffMs: { type: "integer", minimum: 100 },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
});

module.exports = sopDefinitionSchema;
