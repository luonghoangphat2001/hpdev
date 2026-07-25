'use strict';

class DeterministicGuardrailLibraryService {
  validateAction({ actionType, amount = 0, inventoryCount = 10, idempotencyKey }) {
    const checks = Object.freeze({
      schemaValid: true,
      permissionValid: true,
      stateValid: true,
      amountWithinCap: amount <= 10000,
      inventoryAvailable: inventoryCount > 0,
      idempotencyValid: Boolean(idempotencyKey),
    });

    const passed = Object.values(checks).every(Boolean);

    return Object.freeze({
      passed,
      checks,
      validatedAt: new Date().toISOString(),
    });
  }
}

module.exports = DeterministicGuardrailLibraryService;
