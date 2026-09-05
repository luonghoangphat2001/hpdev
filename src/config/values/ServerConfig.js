'use strict';

class ServerConfig {
  /**
   * @param {import('@config/reader/EnvReader')} reader
   */
  constructor(reader) {
    try {
      this.port = reader.requireNumber('PORT');
      this.apiSecret = reader.requireString('API_SECRET');
      this.schemaBaseUrl = reader.requireUrl('SCHEMA_BASE_URL');
      this.jsonSchemaDraftUrl = reader.requireUrl('JSON_SCHEMA_DRAFT_URL');
      this.companyDashboardUrl = reader.requireUrl('COMPANY_DASHBOARD_BASE_URL');
      this.serperKey = reader.getOptionalString('SERPER_KEY', '');
    } catch (err) {
      throw new Error(`[ServerConfig] ${err.message}`);
    }
    Object.freeze(this);
  }
}

module.exports = ServerConfig;
