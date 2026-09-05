'use strict';

class EcommerceConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.baseUrl = reader.requireUrl('ECOMMERCE_API_URL');
    this.agentCode = reader.requireString('ECOMMERCE_AGENT_CODE');
    this.agentToken = reader.getOptionalString('ECOMMERCE_AGENT_TOKEN', '');
    this.webhookKeysJson = reader.requireString('ECOMMERCE_WEBHOOK_KEYS_JSON');
    Object.freeze(this);
  }
}

module.exports = EcommerceConfig;
