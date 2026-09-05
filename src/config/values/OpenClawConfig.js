'use strict';

class OpenClawConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.apiUrl = reader.requireUrl('OPENCLAW_API_URL');
    this.apiSecret = reader.getOptionalString('OPENCLAW_API_SECRET', '');
    this.notificationSecret = reader.getOptionalString('OPENCLAW_NOTIFICATION_SECRET', '');
    this.timeoutMs = reader.getOptionalNumber('OPENCLAW_TIMEOUT_MS', 30000);
    Object.freeze(this);
  }
}

module.exports = OpenClawConfig;
