/**
 * @fileoverview EnvReader - Single responsibility parser and validator for environment variables.
 * Enforces fail-fast validation with descriptive errors and zero || operators.
 */
'use strict';

class EnvReader {
  /**
   * @param {object} [env=process.env]
   */
  constructor(env = process.env) {
    this.env = env;
  }

  /**
   * Requires a non-empty string. Throws error if missing.
   * @param {string} key
   * @returns {string}
   */
  requireString(key) {
    let val = this.env[key]?.trim();
    if (!val) {
      throw new Error(`[Config] Missing required environment variable: ${key}`);
    }
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).trim();
    }
    if (!val) {
      throw new Error(`[Config] Missing required environment variable: ${key}`);
    }
    return val;
  }

  /**
   * Requires a valid numeric value. Throws error if missing or NaN.
   * @param {string} key
   * @returns {number}
   */
  requireNumber(key) {
    const raw = this.requireString(key);
    const num = Number(raw);
    if (Number.isNaN(num)) {
      throw new Error(`[Config] Environment variable ${key} must be a valid number, received: "${raw}"`);
    }
    return num;
  }

  /**
   * Requires a boolean ('true', '1', 'false', '0'). Throws error if invalid.
   * @param {string} key
   * @returns {boolean}
   */
  requireBoolean(key) {
    const raw = this.requireString(key).toLowerCase();
    if (['true', '1'].includes(raw)) return true;
    if (['false', '0'].includes(raw)) return false;
    throw new Error(`[Config] Environment variable ${key} must be a boolean ('true' or 'false'). Received: "${raw}"`);
  }

  /**
   * Requires a valid HTTP/HTTPS URL. Throws error if invalid.
   * @param {string} key
   * @returns {string}
   */
  requireUrl(key) {
    const raw = this.requireString(key);
    try {
      const parsed = new URL(raw);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('protocol must be http: or https:');
      }
      return raw.replace(/\/+$/, '');
    } catch (err) {
      throw new Error(`[Config] Invalid URL for environment variable ${key}: "${raw}". ${err.message}`);
    }
  }

  /**
   * Requires a comma-separated list of values. Throws error if empty.
   * @param {string} key
   * @returns {readonly string[]}
   */
  requireArray(key) {
    const items = this.requireString(key)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (items.length === 0) {
      throw new Error(`[Config] Environment variable ${key} must contain at least one valid item`);
    }
    return Object.freeze(items);
  }

  /**
   * Retrieves an optional string or returns fallback.
   * @param {string} key
   * @param {string} [fallback='']
   * @returns {string}
   */
  getOptionalString(key, fallback = '') {
    const val = this.env[key]?.trim();
    return val ? val : fallback;
  }

  /**
   * Retrieves an optional number or returns fallback.
   * @param {string} key
   * @param {number} [fallback=0]
   * @returns {number}
   */
  getOptionalNumber(key, fallback = 0) {
    const val = this.env[key];
    if (!val) return fallback;
    const num = Number(val);
    return Number.isNaN(num) ? fallback : num;
  }

  /**
   * Retrieves an optional boolean or returns fallback.
   * @param {string} key
   * @param {boolean} [fallback=false]
   * @returns {boolean}
   */
  getOptionalBoolean(key, fallback = false) {
    const val = this.env[key]?.trim().toLowerCase();
    if (!val) return fallback;
    return ['true', '1'].includes(val);
  }

  /**
   * Retrieves an optional comma-separated list or returns fallback.
   * @param {string} key
   * @param {readonly string[]} [fallback=[]]
   * @returns {readonly string[]}
   */
  getOptionalArray(key, fallback = []) {
    const val = this.env[key]?.trim();
    if (!val) return Object.freeze(fallback.slice());
    return Object.freeze(val.split(',').map((item) => item.trim()).filter(Boolean));
  }
}

module.exports = EnvReader;
