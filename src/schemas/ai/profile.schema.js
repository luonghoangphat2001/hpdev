/**
 * @fileoverview profile.schema - Provides profile functionality.
 */
"use strict";

const BaseSchema = require("@schemas/BaseSchema");

module.exports = BaseSchema.create({
  path: "agent-profile.json",
  title: "agent-profile",
  type: "object",
  additionalProperties: false,
  required: [
    "id", "version", "department", "mission", "scope", "kpis",
    "capabilities", "permissions", "prohibitions", "escalationOwner",
    "eventPatterns", "actionPatterns", "routingPriority",
  ],
  properties: {
    id: { type: "string", pattern: "^dan_[a-z0-9_]+$" },
    version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
    department: { type: "string", minLength: 1 },
    mission: { type: "string", minLength: 1 },
    scope: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string" } },
    kpis: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string" } },
    capabilities: {
      type: "array", minItems: 1, uniqueItems: true, items: { type: "string" },
    },
    permissions: {
      type: "array", minItems: 1, uniqueItems: true, items: { type: "string" },
    },
    prohibitions: {
      type: "array", minItems: 1, uniqueItems: true, items: { type: "string" },
    },
    escalationOwner: { type: "string", minLength: 1 },
    eventPatterns: { type: "array", items: { type: "string" } },
    actionPatterns: { type: "array", items: { type: "string" } },
    routingPriority: { type: "integer", minimum: 0, maximum: 100 },
    model: {
      type: "object", additionalProperties: false, required: ["primary", "fallback"],
      properties: {
        primary: { $ref: "#/$defs/modelRef" },
        fallback: { $ref: "#/$defs/modelRef" },
      },
    },
  },
  $defs: {
    modelRef: {
      type: "object", additionalProperties: false, required: ["provider", "name"],
      properties: {
        provider: { type: "string", minLength: 1 },
        name: { type: "string", minLength: 1 },
      },
    },
  },
});
