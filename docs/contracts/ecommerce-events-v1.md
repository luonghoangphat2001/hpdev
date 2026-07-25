# Ecommerce Event Catalog v1

This catalog records events that `My_Ecommerce/dashboard` actually emits at
runtime. OpenClaw must reject or quarantine unknown event names instead of
guessing their meaning.

## Envelope

The current Ecommerce webhook job sends these fields:

- `webhook_id`
- `event`
- `timestamp`
- `data`
- `changes`

The request uses an `X-Hub-Signature` SHA-256 HMAC of the JSON payload. Replay
protection and a stable delivery/event identifier are not part of this version
and must be added by later contract tasks.

## Runtime events

| Aggregate | Events |
| --- | --- |
| Order | `order.created`, `order.updated`, `order.deleted`, `order.restored` |
| Product | `product.created`, `product.updated`, `product.deleted`, `product.restored` |
| Product category | `productcategory.created`, `productcategory.updated`, `productcategory.deleted` |

## Known producer/UI gaps

- The Ecommerce webhook settings UI advertises `category.*`, but
  `ProductCategory` currently derives the runtime topic from its class name and
  therefore emits `productcategory.*`.
- The UI advertises `user.created`, but the `User` model does not currently use
  the webhook producer trait.
- The UI omits `product.restored`, although the `Product` model uses soft
  deletes and the producer trait emits the restored lifecycle event.

These gaps are deliberately not normalized inside OpenClaw. They must be fixed
at the Ecommerce producer and released as a new catalog version so event names
remain explicit and auditable.
