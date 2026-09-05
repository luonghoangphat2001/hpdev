/**
 * @fileoverview Central application configuration for OpenClaw.
 * Adheres strictly to SOLID principles (Single Responsibility, Cohesion, Immutability).
 * Composes dedicated Value Objects for Server, Database, Ecommerce, DanAi, Ceo, and Reporting.
 */
'use strict';

require('module-alias/register');
require('dotenv').config();

const EnvReader = require('@config/reader/EnvReader');
const ServerConfig = require('@config/values/ServerConfig');
const DatabaseConfig = require('@config/values/DatabaseConfig');
const EcommerceConfig = require('@config/values/EcommerceConfig');
const DanAiConfig = require('@config/values/DanAiConfig');
const CeoConfig = require('@config/values/CeoConfig');
const ReportingConfig = require('@config/values/ReportingConfig');
const IntelligenceConfig = require('@config/values/IntelligenceConfig');

class Config {
  /**
   * @param {object} [env=process.env]
   */
  constructor(env = process.env) {
    const reader = new EnvReader(env);

    this.server = new ServerConfig(reader);
    this.database = new DatabaseConfig(reader);
    this.ecommerce = new EcommerceConfig(reader);
    this.danAi = new DanAiConfig(reader);
    this.ceo = new CeoConfig(reader);
    this.reporting = new ReportingConfig(reader);
    this.intelligence = new IntelligenceConfig(reader);

    // Direct accessors for backward compatibility
    this.port = this.server.port;
    this.apiSecret = this.server.apiSecret;
    this.schemaBaseUrl = this.server.schemaBaseUrl;
    this.jsonSchemaDraftUrl = this.server.jsonSchemaDraftUrl;
    this.companyDashboardUrl = this.server.companyDashboardUrl;
    this.serperKey = this.server.serperKey;

    this.orchestratorDatabase = this.database;
    this.ecommerceApi = this.ecommerce;
    this.ecommerceWebhookKeysJson = this.ecommerce.webhookKeysJson;
    this.danAiApi = this.danAi;
    this.danAiIntegration = this.danAi;

    this.ceoDiscordUserIds = this.ceo.discordUserIds;
    this.ceoDashboardActorIds = this.ceo.dashboardActorIds;
    this.ceoOperatorIds = this.ceo.operatorIds;
    this.dailyBrief = this.ceo.dailyBrief;

    this.dailyReport = this.reporting.dailyReport;
    this.orchestratorProductionEnabled = this.reporting.orchestratorProductionEnabled;
    this.intelligenceWarnings = this.intelligence.warnings;

    this.crawl4aiBaseUrl = null;
    this.stagehand = Object.freeze({});

    this.Config = Config;
    this.EnvConfig = Config;
    this.EnvReader = EnvReader;
    Object.freeze(this);
  }

  get serperApiKey() {
    return this.server.serperKey;
  }
}

const config = new Config();

module.exports = config;
