'use strict';

class DanAiConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.baseUrl = reader.requireUrl('DAN_AI_API_URL');
    this.apiSecret = reader.requireString('DAN_AI_API_SECRET');
    this.timeoutMs = reader.requireNumber('DAN_AI_API_TIMEOUT_MS');
    Object.freeze(this);
  }
}

module.exports = DanAiConfig;
