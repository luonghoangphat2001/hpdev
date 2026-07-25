'use strict';

const DeterministicGuardrailLibraryService = require('../../src/application/services/deterministic-guardrail-library.service');

describe('T175: Deterministic Guardrail Library Service', () => {
  test('validates action schema, permission, state, amount, inventory, and idempotency in code', () => {
    const service = new DeterministicGuardrailLibraryService();
    const valid = service.validateAction({ actionType: 'PO_CREATE', amount: 500, inventoryCount: 5, idempotencyKey: 'key_123' });

    expect(valid.passed).toBe(true);
    expect(valid.checks.amountWithinCap).toBe(true);

    const invalid = service.validateAction({ actionType: 'PO_CREATE', amount: 99999, inventoryCount: 0, idempotencyKey: '' });
    expect(invalid.passed).toBe(false);
  });
});
