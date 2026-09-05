/**
 * @fileoverview BasePolicy - Abstract base class for all security, compliance, budget, and runtime policies.
 * @module policy/BasePolicy
 */
'use strict';

const AppError = require("@utils/errors/app.error");

/**
 * PolicyViolationError
 * Error thrown when a policy rule is explicitly violated.
 */
class PolicyViolationError extends AppError {
  constructor(message, details = {}) {
    super(message, 403, "POLICY_VIOLATION", details);
  }
}

/**
 * BasePolicy
 * Abstract base class providing common evaluation, enforcement, validation, and outcome helpers.
 */
class BasePolicy {
  /**
   * @param {Object} [options={}] - Configuration options for the policy.
   * @param {string} [options.name] - Descriptive name of the policy.
   * @param {string} [options.version="1.0.0"] - Policy version.
   * @param {boolean} [options.enabled=true] - Whether the policy is currently active.
   */
  constructor({ name = "BasePolicy", version = "1.0.0", enabled = true } = {}) {
    this.name = name;
    this.version = version;
    this.enabled = enabled;
  }

  /**
   * Evaluates the policy against given context data.
   * Override in subclass.
   * @param {Object} [context={}] - Context data for evaluation.
   * @returns {Object} { allowed: boolean, reason?: string, details?: any }
   */
  evaluate(context = {}) {
    return this.allow({ reason: "Default allow from BasePolicy" });
  }

  /**
   * Enforces the policy against context data, throwing PolicyViolationError if evaluation fails.
   * @param {Object} [context={}] - Context data for enforcement.
   * @returns {Object} Evaluation result if allowed.
   * @throws {PolicyViolationError}
   */
  enforce(context = {}) {
    const result = this.evaluate(context);
    if (!result.allowed) {
      throw new PolicyViolationError(
        result.reason || `Policy ${this.name} enforcement failed`,
        result
      );
    }
    return result;
  }

  /**
   * Validates required keys in context object.
   * @param {Object} context - Target context object.
   * @param {string[]} requiredKeys - List of required keys.
   * @throws {TypeError} If context is missing required keys.
   */
  validateContext(context, requiredKeys = []) {
    if (!context || typeof context !== "object") {
      throw new TypeError(`[${this.name}] Context must be a non-null object`);
    }
    for (const key of requiredKeys) {
      if (context[key] === undefined || context[key] === null) {
        throw new TypeError(`[${this.name}] Missing required context key: "${key}"`);
      }
    }
  }

  /**
   * Helper returning allowed outcome object.
   * @param {Object} [details={}] - Additional details.
   * @returns {Object} Frozen allowed result object.
   */
  allow(details = {}) {
    return Object.freeze({
      allowed: true,
      policy: this.name,
      version: this.version,
      ...details,
    });
  }

  /**
   * Helper returning denied outcome object.
   * @param {string} reason - Rejection reason.
   * @param {Object} [details={}] - Additional details.
   * @returns {Object} Frozen denied result object.
   */
  deny(reason, details = {}) {
    return Object.freeze({
      allowed: false,
      reason,
      policy: this.name,
      version: this.version,
      ...details,
    });
  }
}

BasePolicy.PolicyViolationError = PolicyViolationError;

module.exports = BasePolicy;
