/**
 * @fileoverview action.schemas - Provides actions functionality.
 */
"use strict";

const BaseSchema = require("../BaseSchema");
const actionCatalog = require("./action.catalog");

const id = { type: ["string", "integer"], minLength: 1 };
const pagination = {
  page: { type: "integer", minimum: 1 },
  per_page: { type: "integer", minimum: 1, maximum: 100 },
};

function schema(actionName, properties = {}, required = []) {
  return BaseSchema.create({
    path: `actions/${actionName}.json`,
    title: `${actionName}-request`,
    type: "object",
    additionalProperties: false,
    required,
    properties,
  });
}

const ACTION_REQUEST_SCHEMAS = Object.freeze({
  "order.list": schema("order.list", {
    ...pagination,
    status: {
      type: "string",
      enum: ["pending", "AgentProfileRegistry", "processing", "delivering", "completed", "cancelled", "refunded"],
    },
  }),
  "order.read": schema("order.read", { order_id: id }, ["order_id"]),
  "product.list": schema("product.list", {
    ...pagination,
    query: { type: "string", maxLength: 255 },
  }),
  "product.read": schema("product.read", { product_id: id }, ["product_id"]),
  "inventory.read": schema("inventory.read", { product_id: id }, ["product_id"]),
  "finance.summary.read": schema("finance.summary.read", {
    period: { type: "string", enum: ["day", "week", "month", "quarter", "year"] },
  }, ["period"]),
  "cskh.feedback.list": schema("cskh.feedback.list", {
    ...pagination,
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
  }),
  "inventory.purchase_order_draft.create": schema(
    "inventory.purchase_order_draft.create",
    {
      supplier_name: { type: "string", minLength: 1, maxLength: 255 },
      total_amount: { type: "number", minimum: 0 },
      expected_delivery_date: { type: "string", format: "date" },
    },
    ["supplier_name", "total_amount", "expected_delivery_date"],
  ),
  "finance.refund.execute": schema("finance.refund.execute", {
    order_id: id,
    amount: { type: "integer", minimum: 1 },
    reason: { type: "string", minLength: 3, maxLength: 1000 },
  }, ["order_id", "amount", "reason"]),
  "ops.order_status.update": schema("ops.order_status.update", {
    order_id: id,
    target_status: {
      type: "string",
      enum: ["pending", "AgentProfileRegistry", "processing", "delivering", "completed", "cancelled", "refunded"],
    },
    reason: { type: "string", maxLength: 1000 },
  }, ["order_id", "target_status"]),
  "cskh.response.send": schema("cskh.response.send", {
    feedback_id: id,
    reply_content: { type: "string", minLength: 1, maxLength: 5000 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  }, ["feedback_id", "reply_content", "confidence"]),
  "cskh.voucher.issue": schema("cskh.voucher.issue", {
    customer_id: id,
    code: { type: "string", pattern: "^[A-Z0-9_-]{3,64}$" },
    type: { type: "string", enum: ["fixed", "percent"] },
    amount: { type: "number", exclusiveMinimum: 0 },
    expiry_date: { type: "string", format: "date-time" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  }, ["customer_id", "code", "type", "amount", "expiry_date", "confidence"]),
});

const missingSchemas = actionCatalog.list()
  .map(({ name }) => name)
  .filter((name) => !ACTION_REQUEST_SCHEMAS[name]);
if (missingSchemas.length > 0) {
  throw new TypeError(`Missing action request schemas: ${missingSchemas.join(", ")}`);
}

module.exports = ACTION_REQUEST_SCHEMAS;
