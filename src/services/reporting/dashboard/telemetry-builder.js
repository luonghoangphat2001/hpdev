/**
 * @fileoverview telemetry-builder - Provides telemetry-builder functionality.
 */
'use strict';

const mysqlPoolFactory = require('../../../database/mysql-pool');
const IntelligenceObservabilityRepository = require('../../../repositories/IntelligenceObservabilityRepository');
const TelemetryService = require('./telemetry.service');

function buildIntelligenceTelemetry({
  pool = mysqlPoolFactory.create(),
  telemetryRepository = new IntelligenceObservabilityRepository(pool),
} = {}) {
  return new TelemetryService({
    telemetryRepository,
  });
}

module.exports = {
  buildIntelligenceTelemetry,
};
