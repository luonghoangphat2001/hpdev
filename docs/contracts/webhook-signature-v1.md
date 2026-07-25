# Webhook Signature and Replay Contract v1

Canonical signing input:

`v1:<unix_timestamp>:<delivery_id>:<sha256(raw_body)>`

The signature is HMAC-SHA256 and transported as `v1=<hex>`. Required headers
are timestamp, delivery ID, key ID and signature. Verification uses constant
time comparison, accepts at most five minutes of clock skew and returns a
replay key with a ten-minute TTL.

Key IDs allow the current and previous key to overlap during rotation without
downtime. Unknown key IDs fail closed.

The existing Ecommerce webhook producer signs JSON with `X-Hub-Signature`
without timestamp, delivery ID or key ID. Intake must not switch to this v1
contract until the producer is upgraded in the coordinated Ecommerce task.
