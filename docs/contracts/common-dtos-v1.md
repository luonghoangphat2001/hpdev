# Common DTO Contracts v1

OpenClaw uses JSON Schema draft 2020-12 contracts for data crossing module or
system boundaries. Every DTO carries `schema_version: "1.0.0"` and rejects
unknown root fields to prevent silent contract drift.

## Registered DTOs

| DTO | Purpose |
| --- | --- |
| `event-dto` | Canonical event received from Ecommerce, OpenClaw or dan_ai |
| `workflow-dto` | Workflow identity, state, risk and correlation |
| `agent-task-dto` | Work assigned to one of the five agents and its result |
| `approval-dto` | Immutable approval request and CEO decision metadata |
| `agent-report-dto` | Daily/periodic report with metrics and source references |

Schema IDs use:
`https://openclaw.hpdev.name.vn/schemas/v1/<dto-name>.json`.

The registry is injectable so later modules can add a new version without
modifying consumers. Runtime payload validation and normalization are handled
by their dedicated implementation tasks; this task freezes the shared wire
contract only.
