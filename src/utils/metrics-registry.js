/**
 * @fileoverview metrics-registry - Provides metrics-registry functionality.
 */
'use strict';

/**
 * MetricsRegistry
 * Manages metrics registry logic.
 */
class MetricsRegistry {
  /**
   * constructor - Executes constructor.
   * @returns {*} Result of operation.
   */
  constructor() {
    this.counters = new Map();
    this.timings = new Map();
  }

  /**
   * increment - Executes increment.
   * @param {*} name - Input parameter.
   * @param {*} labels - Input parameter.
   * @param {*} value - Input parameter.
   * @returns {*} Result of operation.
   */
  increment(name, labels = {}, value = 1) {
    const key = this.#key(name, labels);
    const current = this.counters.get(key) || { name, labels: { ...labels }, value: 0 };
    current.value += value;
    this.counters.set(key, current);
  }

  /**
   * observe - Executes observe.
   * @param {*} name - Input parameter.
   * @param {*} milliseconds - Input parameter.
   * @param {*} labels - Input parameter.
   * @returns {*} Result of operation.
   */
  observe(name, milliseconds, labels = {}) {
    const key = this.#key(name, labels);
    const current = this.timings.get(key) || {
      name,
      labels: { ...labels },
      count: 0,
      totalMs: 0,
      maxMs: 0,
    };
    current.count += 1;
    current.totalMs += milliseconds;
    current.maxMs = Math.max(current.maxMs, milliseconds);
    this.timings.set(key, current);
  }

  /**
   * snapshot - Executes snapshot.
   * @returns {*} Result of operation.
   */
  snapshot() {
    return Object.freeze({
      counters: Array.from(this.counters.values()).map((metric) => Object.freeze({
        ...metric,
        labels: Object.freeze({ ...metric.labels }),
      })),
      timings: Array.from(this.timings.values()).map((metric) => Object.freeze({
        ...metric,
        averageMs: metric.count ? metric.totalMs / metric.count : 0,
        labels: Object.freeze({ ...metric.labels }),
      })),
    });
  }

  #key(name, labels) {
    const normalized = Object.keys(labels).sort()
      .map((key) => `${key}=${labels[key]}`)
      .join(',');
    return `${name}{${normalized}}`;
  }
}

const defaultRegistry = new MetricsRegistry();
module.exports = defaultRegistry;
module.exports.MetricsRegistry = MetricsRegistry;
