/**
 * @fileoverview handoff.dto - Provides handoff functionality.
 */
"use strict";

const BaseSchema = require("@schemas/BaseSchema");

const crossAgentHandoffSchema = BaseSchema.create({
  path: "cross-agent-handoff.json",
  title: "CrossAgentHandoff",
  type: "object",
  additionalProperties: false,
  required: [
    "handoffId",
    "sourceAgent",
    "targetAgent",
    "workflowId",
    "payload",
    "expectedResult",
    "deadlineAt",
    "createdAt",
  ],
  properties: {
    handoffId: { type: "string", minLength: 1 },
    sourceAgent: { type: "string", minLength: 1 },
    targetAgent: { type: "string", minLength: 1 },
    workflowId: { type: "string", minLength: 1 },
    contextRefs: {
      type: "array",
      items: { type: "string" },
    },
    payload: { type: "object" },
    expectedResult: { type: "string", minLength: 1 },
    deadlineAt: { type: "string", format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
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
    throw new Error("Missing required fields for CrossAgentHandoff DTO");
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
