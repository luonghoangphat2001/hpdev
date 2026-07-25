# Ecommerce Agent Action Catalog v1

This contract defines the only SSOT actions OpenClaw may call. The catalog is
an allowlist, not a discovery mechanism: an unknown action is denied.

All paths are under `/api/v1/storefront/agents` and require the Ecommerce
`VerifyAgentToken` middleware. The current route group exists but contains no
implemented endpoints, so every v1 action is explicitly marked `planned`.
Downstream clients must not execute an action until its availability is changed
by the Ecommerce implementation task.

## Read actions

| Action | Method and endpoint | Permission |
| --- | --- | --- |
| `order.list` | `GET /orders` | `order.read` |
| `order.read` | `GET /orders/{order_id}` | `order.read` |
| `product.list` | `GET /products` | `product.read` |
| `product.read` | `GET /products/{product_id}` | `product.read` |
| `inventory.read` | `GET /inventory/{product_id}` | `inventory.read` |
| `finance.summary.read` | `GET /finance/summary` | `finance.read` |
| `cskh.feedback.list` | `GET /customer-feedback` | `cskh.read` |

Successful reads return HTTP `200` and a `data` field.

## Write actions

| Action | Method and endpoint | Permission |
| --- | --- | --- |
| `inventory.purchase_order_draft.create` | `POST /purchase-orders/drafts` | `purchase_order_draft.create` |
| `finance.refund.execute` | `POST /orders/{order_id}/refunds` | `refund.execute` |
| `ops.order_status.update` | `POST /orders/{order_id}/status` | `order_status.update` |
| `cskh.response.send` | `POST /customer-feedback/{feedback_id}/responses` | `cskh_response.send` |
| `cskh.voucher.issue` | `POST /customers/{customer_id}/vouchers` | `voucher.issue` |

Successful writes return HTTP `200`, `201`, or `202` with an action receipt:

- `action_id`
- `idempotency_key`
- `status`
- `resource_type`
- `resource_id`
- `resource_version`
- `executed_at`

Risk level, approval threshold and agent-specific grants are deliberately
defined by later policy tasks. An action appearing here does not grant any agent
permission by itself.
