# Correlation and Idempotency Convention v1

Typed IDs use a short prefix followed by UUID:

- `evt_` event
- `wf_` workflow
- `act_` action
- `apr_` approval
- `tsk_` agent task
- `rpt_` report
- `cor_` cross-system correlation

Idempotency keys use
`idem:v1:<scope>:<sha256(stable operation/subject/version/payload)>`. Object keys
are sorted before hashing, so equivalent payloads produce the same key. Resource
version is included to prevent stale retries from being treated as current.

Structured logs reserve timestamp, level, event, workflow, action, agent,
correlation and error-code fields. Fields remain present with `null` when a
stage has not created that identifier yet.
