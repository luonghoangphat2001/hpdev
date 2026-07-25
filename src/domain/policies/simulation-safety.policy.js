'use strict';

const FORBIDDEN_KEYS = /^(execute|write|mutate|commit|dispatch|send|issue|refund)$/i;

class SimulationSafetyPolicy {
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

module.exports = SimulationSafetyPolicy;
