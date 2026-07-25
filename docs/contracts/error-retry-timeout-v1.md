# Error, Retry and Timeout Policy v1

Errors are classified before retry. Validation, authentication, permission,
not-found, conflict and business-rule failures are never retried. Rate limits,
timeouts, temporary upstream failures and network failures are retryable.

Retry uses at most three attempts with jittered backoff of 250 ms, 1 s and 4 s.
A write action is retryable only when it carries an idempotency key.

Every SSOT action has an explicit timeout:

- Normal reads: 5 seconds.
- Finance and CSKH aggregate reads: 10 seconds.
- Normal writes: 10 seconds.
- Refund execution: 15 seconds.

Unknown action or error codes fail closed and are not retried.
