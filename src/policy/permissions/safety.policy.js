/**
 * @fileoverview safety.policy - Provides safety functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

const FORBIDDEN_KEYS = /^(execute|write|mutate|commit|dispatch|send|issue|refund)$/i;

/**
 * SafetyPolicy
 * Manages safety policy logic.
 */
class SafetyPolicy extends BasePolicy {
  constructor(options = {}) {
    super({ name: 'SafetyPolicy' });


  }
  /**
   * assertSafe - Executes assert safe.
   * @param {*} value - Input parameter.
   * @param {*} path - Input parameter.
   * @returns {*} Result of operation.
   */
  assertSafe(value, path = '$') {
    if (Array.isArray(value)) {
      value.forEach((item, index) => this.assertSafe(item, `${path}[${index}]`));
      return true;
    }
    if (!value || typeof value !== 'object') return true;
    Object.entries(value).forEach(([key, item]) => {
      if (FORBIDDEN_KEYS.test(key) && item !== false && item !== null) {
        const error = new Error(`Mutation intent is forbidden in simulation: ${path}.${key}`);
        error.code = 'simulation_mutation_forbidden';
        throw error;
      }
      this.assertSafe(item, `${path}.${key}`);
    });
    return true;
  }
}

module.exports = SafetyPolicy;
