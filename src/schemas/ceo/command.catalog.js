/**
 * @fileoverview command.catalog - Provides command functionality.
 */
"use strict";

const BaseSchema = require("@schemas/BaseSchema");

const COMMAND_CATALOG_VERSION = "1.0.0";

function command(name, {
  description,
  permission,
  risk,
  handler,
  required,
  properties,
}) {
  return Object.freeze({
    name,
    description,
    permission,
    risk,
    handler,
    version: COMMAND_CATALOG_VERSION,
    inputSchema: BaseSchema.create({
      path: `commands/${name}.json`,
      type: "object",
      additionalProperties: false,
      required: Object.freeze(required),
      properties: Object.freeze(properties),
    }),
  });
}

const id = Object.freeze({ type: "string", minLength: 1, maxLength: 128 });
const reason = Object.freeze({ type: "string", minLength: 1, maxLength: 2000 });

const CEO_COMMANDS = Object.freeze([
  command("goal.create", {
    description: "Create a versioned CEO goal or OKR",
    permission: "goal.create",
    risk: "medium",
    handler: "goal.create",
    required: ["horizon", "title", "ownerType", "ownerId", "target", "startsAt", "deadlineAt"],
    properties: {
      parentGoalId: id,
      horizon: { type: "string", enum: ["year", "quarter", "month", "week"] },
      title: { type: "string", minLength: 1, maxLength: 500 },
      description: { type: "string", maxLength: 2000 },
      ownerType: { type: "string", enum: ["ceo", "agent", "department"] },
      ownerId: id,
      target: {
        type: "object",
        required: ["metric", "value"],
        properties: { metric: { type: "string" }, value: {} },
      },
      startsAt: { type: "string", format: "date-time" },
      deadlineAt: { type: "string", format: "date-time" },
    },
  }),
  command("portfolio.priority.change", {
    description: "Change workflow portfolio priority",
    permission: "portfolio.priority.change",
    risk: "medium",
    handler: "portfolio.priority.change",
    required: ["workflowId", "priority", "reason"],
    properties: {
      workflowId: id,
      priority: { type: "integer", minimum: 0, maximum: 100 },
      reason,
    },
  }),
  ...["pause", "resume"].map((operation) => command(`workflow.${operation}`, {
    description: `${operation} a workflow`,
    permission: "workflow.control",
    risk: "high",
    handler: "workflow.control",
    required: ["workflowId", "expectedVersion", "reason"],
    properties: {
      workflowId: id,
      expectedVersion: { type: "integer", minimum: 1 },
      reason,
    },
  })),
  ...["approve", "reject"].map((decision) => command(`approval.${decision}`, {
    description: `${decision} an approval request`,
    permission: "approval.decide",
    risk: "critical",
    handler: "approval.decide",
    required: ["approvalId", "decisionVersion", "reason"],
    properties: {
      approvalId: id,
      decisionVersion: { type: "integer", minimum: 1 },
      reason,
    },
  })),
  command("analysis.request", {
    description: "Request a read-only strategic analysis",
    permission: "analysis.request",
    risk: "low",
    handler: "analysis.request",
    required: ["question"],
    properties: {
      question: { type: "string", minLength: 3, maxLength: 4000 },
      scope: { type: "string", maxLength: 128 },
    },
  }),
]);

/**
 * CeoCommandCatalog
 * Manages ceo command catalog logic.
 */
class CeoCommandCatalog {
  /**
   * constructor - Executes constructor.
   * @param {*} commands - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(commands = CEO_COMMANDS) {
    this.commands = new Map();
    commands.forEach((entry) => {
      if (this.commands.has(entry.name)) throw new TypeError(`Duplicate CEO command: ${entry.name}`);
      this.commands.set(entry.name, entry);
    });
  }

  /**
   * get - Executes get.
   * @param {*} name - Input parameter.
   * @returns {*} Result of operation.
   */
  get(name) {
    return this.commands.get(name) || null;
  }

  /**
   * list - Executes list.
   * @returns {*} Result of operation.
   */
  list() {
    return Array.from(this.commands.values());
  }
}

module.exports = new CeoCommandCatalog();
module.exports.CeoCommandCatalog = CeoCommandCatalog;
module.exports.CEO_COMMANDS = CEO_COMMANDS;
module.exports.COMMAND_CATALOG_VERSION = COMMAND_CATALOG_VERSION;
