'use strict';

class ReportingConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.dailyReport = Object.freeze({
      enabled: reader.requireBoolean('DAILY_REPORT_ENABLED'),
      timezone: reader.requireString('DAILY_REPORT_TIMEZONE'),
      time: reader.requireString('DAILY_REPORT_TIME'),
      agentTimeoutMs: reader.requireNumber('DAILY_REPORT_AGENT_TIMEOUT_MS'),
    });
    this.orchestratorProductionEnabled = reader.requireBoolean('ORCHESTRATOR_PRODUCTION_ENABLED');
    Object.freeze(this);
  }
}

module.exports = ReportingConfig;
