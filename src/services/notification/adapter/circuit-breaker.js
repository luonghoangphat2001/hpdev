/**
 * @fileoverview circuit-breaker - Provides circuit-breaker functionality.
 */
'use strict';

/**
 * CircuitOpenError
 * Manages circuit open error logic.
 */
class CircuitOpenError extends Error {
  /**
   * constructor - Executes constructor.
   * @param {*} key - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(key) {
    super(`Circuit is open: ${key}`);
    this.name = 'CircuitOpenError';
    this.code = 'circuit_open';
    this.key = key;
  }
}

/**
 * CircuitBreaker
 * Manages circuit breaker logic.
 */
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

  /**
   * assertRequestAllowed - Executes assert request allowed.
   * @param {*} key - Input parameter.
   * @returns {*} Result of operation.
   */
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

  /**
   * recordSuccess - Executes record success.
   * @param {*} key - Input parameter.
   * @returns {*} Result of operation.
   */
  recordSuccess(key) {
    this.circuits.set(key, { state: 'closed', failures: 0, openedAt: null });
  }

  /**
   * recordFailure - Executes record failure.
   * @param {*} key - Input parameter.
   * @returns {*} Result of operation.
   */
  recordFailure(key) {
    const circuit = this.get(key);
    circuit.failures += 1;
    if (circuit.state === 'half_open' || circuit.failures >= this.failureThreshold) {
      circuit.state = 'open';
      circuit.openedAt = this.clock();
    }
  }

  /**
   * get - Executes get.
   * @param {*} key - Input parameter.
   * @returns {*} Result of operation.
   */
  get(key) {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, { state: 'closed', failures: 0, openedAt: null });
    }
    return this.circuits.get(key);
  }
}

module.exports = CircuitBreaker;
module.exports.CircuitOpenError = CircuitOpenError;
