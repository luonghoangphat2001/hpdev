# Risk and Approval Policy v1

Every allowlisted SSOT action has one deterministic risk policy. Unknown
actions are `critical`, denied by default and may not be rescued by an LLM.

## Matrix

| Group | Base risk | Approval |
| --- | --- | --- |
| Read-only order/product/inventory/finance/CSKH | Low | Never |
| Purchase-order draft | Medium | Conditional by total amount |
| Order status update | Medium | Conditional; cancel/refund escalates |
| External CSKH response | Medium | Conditional by confidence |
| Voucher issue | Medium | Conditional by amount and confidence |
| Real refund execution | Critical | Always |

Thresholds live in the versioned policy configuration, not in agent prompts:

- Purchase-order draft amount: `500000`
- Voucher amount: `100000`
- External response confidence: `0.85`
- Voucher confidence: `0.90`

These are initial defaults, not permanent business constants. Runtime policy
may override them through a later audited configuration task. Risk can only be
raised by conditions; an agent cannot lower its own risk or bypass approval.
