/**
 * @fileoverview health-check.service - Provides health-check functionality.
 */
'use strict';

/**
 * HealthCheckService
 * Manages health check logic.
 */
class HealthCheckService {
  /**
   * constructor - Executes constructor.
   * @param {*} databaseClient - Input parameter.
   * @param {*} ssotClient - Input parameter.
   * @param {*} redisClient - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ databaseClient, ssotClient, redisClient } = {}) {
    this.databaseClient = databaseClient;
    this.ssotClient = ssotClient;
    this.redisClient = redisClient;
  }

  /**
   * checkLiveness - Asynchronously executes check liveness.
   * @returns {*} Promise resolving result.
   */
  async checkLiveness() {
    return Object.freeze({ status: 'UP', timestamp: new Date().toISOString() });
  }

  /**
   * checkReadiness - Asynchronously executes check readiness.
   * @returns {*} Promise resolving result.
   */
  async checkReadiness() {
    let dbStatus = 'UP';
    let ssotStatus = 'UP';

    if (this.databaseClient && typeof this.databaseClient.ping === 'function') {
      try {
        await this.databaseClient.ping();
      } catch (err) {
        dbStatus = 'DOWN';
      }
    }

    if (this.ssotClient && typeof this.ssotClient.ping === 'function') {
      try {
        await this.ssotClient.ping();
      } catch (err) {
        ssotStatus = 'DEGRADED';
      }
    }

    const isHealthy = dbStatus === 'UP';
    const isDegraded = ssotStatus === 'DEGRADED';

    return Object.freeze({
      status: isHealthy ? (isDegraded ? 'DEGRADED' : 'UP') : 'DOWN',
      dependencies: Object.freeze({ database: dbStatus, ssot: ssotStatus }),
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = HealthCheckService;
