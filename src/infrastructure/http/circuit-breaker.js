'use strict';

class CircuitOpenError extends Error {
  constructor(key) {
    super(`Circuit is open: ${key}`);
    this.name = 'CircuitOpenError';
    this.code = 'circuit_open';
    this.key = key;
  }
}

class CircuitBreaker {
  constructor({
    failureThreshold = 5,
    cooldownMs = 30000,
    clock = () => Date.now(),
  } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.clock = clock;
    this.circuits = new Map();
  }

  assertRequestAllowed(key) {
    const circuit = this.get(key);
    if (circuit.state !== 'open') {
      return;
    }
    if (this.clock() - circuit.openedAt < this.cooldownMs) {
      throw new CircuitOpenError(key);
    }
    circuit.state = 'half_open';
  }

  recordSuccess(key) {
    this.circuits.set(key, { state: 'closed', failures: 0, openedAt: null });
  }

  recordFailure(key) {
    const circuit = this.get(key);
    circuit.failures += 1;
    if (circuit.state === 'half_open' || circuit.failures >= this.failureThreshold) {
      circuit.state = 'open';
      circuit.openedAt = this.clock();
    }
  }

  get(key) {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, { state: 'closed', failures: 0, openedAt: null });
    }
    return this.circuits.get(key);
  }
}

module.exports = CircuitBreaker;
module.exports.CircuitOpenError = CircuitOpenError;
