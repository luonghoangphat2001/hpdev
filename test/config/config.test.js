'use strict';

const config = require('@config');
const { Config, EnvReader } = require('@config');

describe('Config', () => {
  const validEnv = {
    PORT: '4000',
    API_SECRET: 'test-secret',
    SCHEMA_BASE_URL: 'https://schema.example.com',
    JSON_SCHEMA_DRAFT_URL: 'https://json-schema.org/draft/2020-12/schema',
    COMPANY_DASHBOARD_BASE_URL: 'https://company.example.com',
    ECOMMERCE_API_URL: 'https://api.ecommerce.example.com',
    ECOMMERCE_AGENT_CODE: 'DAN_CSKH',
    ECOMMERCE_WEBHOOK_KEYS_JSON: '{"key":"value"}',
    DAN_AI_API_URL: 'http://dan-api:3000',
    DAN_AI_API_SECRET: 'shared-secret',
    DAN_AI_API_TIMEOUT_MS: '5000',
    DAILY_REPORT_ENABLED: 'true',
    DAILY_REPORT_TIMEZONE: 'Asia/Ho_Chi_Minh',
    DAILY_REPORT_TIME: '22:00',
    DAILY_REPORT_AGENT_TIMEOUT_MS: '10000',
    ORCHESTRATOR_PRODUCTION_ENABLED: 'false',
    INTELLIGENCE_LATENCY_WARNING_MS: '3000',
    INTELLIGENCE_TOKEN_WARNING: '4000',
    INTELLIGENCE_COST_WARNING_USD: '0.05',
    CEO_DAILY_BRIEF_ENABLED: 'true',
    CEO_DAILY_BRIEF_TIMEZONE: 'Asia/Ho_Chi_Minh',
    CEO_DAILY_BRIEF_TIME: '07:30',
    CEO_DAILY_BRIEF_SECTION_TIMEOUT_MS: '5000',
    ORCHESTRATOR_DB_HOST: '127.0.0.1',
    ORCHESTRATOR_DB_PORT: '3306',
    ORCHESTRATOR_DB_NAME: 'dan_ai',
    ORCHESTRATOR_DB_USER: 'dan_ai_user',
    ORCHESTRATOR_DB_POOL_MAX: '10',
    ORCHESTRATOR_DB_POOL_MIN: '2',
  };

  test('successfully instantiates when all required environment variables are present', () => {
    const testConfig = new Config(validEnv);
    expect(testConfig.port).toBe(4000);
    expect(testConfig.apiSecret).toBe('test-secret');
    expect(testConfig.companyDashboardUrl).toBe('https://company.example.com');
    expect(testConfig.server).toBeDefined();
    expect(testConfig.database).toBeDefined();
    expect(testConfig.ecommerce).toBeDefined();
    expect(testConfig.danAi).toBeDefined();
    expect(testConfig.ceo).toBeDefined();
    expect(testConfig.reporting).toBeDefined();
    expect(testConfig.intelligence).toBeDefined();
  });

  test('throws explicit error when required PORT is missing', () => {
    const env = { ...validEnv };
    delete env.PORT;
    expect(() => new Config(env)).toThrow('[Config] Missing required environment variable: PORT');
  });

  test('throws explicit error when PORT is non-numeric', () => {
    const env = { ...validEnv, PORT: 'abc' };
    expect(() => new Config(env)).toThrow('[Config] Environment variable PORT must be a valid number, received: "abc"');
  });

  test('throws explicit error when API_SECRET is missing', () => {
    const env = { ...validEnv };
    delete env.API_SECRET;
    expect(() => new Config(env)).toThrow('[Config] Missing required environment variable: API_SECRET');
  });

  test('throws explicit error when SCHEMA_BASE_URL is missing', () => {
    const env = { ...validEnv };
    delete env.SCHEMA_BASE_URL;
    expect(() => new Config(env)).toThrow('[Config] Missing required environment variable: SCHEMA_BASE_URL');
  });

  test('throws explicit error when SCHEMA_BASE_URL has invalid protocol', () => {
    const env = { ...validEnv, SCHEMA_BASE_URL: 'ftp://schema.example.com' };
    expect(() => new Config(env)).toThrow('must use http: or https: protocol');
  });

  test('throws explicit error when COMPANY_DASHBOARD_BASE_URL is missing', () => {
    const env = { ...validEnv };
    delete env.COMPANY_DASHBOARD_BASE_URL;
    expect(() => new Config(env)).toThrow('[Config] Missing required environment variable: COMPANY_DASHBOARD_BASE_URL');
  });

  test('throws explicit error when boolean variable is invalid', () => {
    const env = { ...validEnv, DAILY_REPORT_ENABLED: 'not_a_boolean' };
    expect(() => new Config(env)).toThrow(
      "[Config] Environment variable DAILY_REPORT_ENABLED must be a boolean ('true' or 'false')"
    );
  });

  test('handles optional variables gracefully without errors', () => {
    const env = {
      ...validEnv,
      SERPER_KEY: 'test-serper-key',
      CEO_DISCORD_USER_IDS: '111,222',
      CEO_DASHBOARD_ACTOR_IDS: 'actor-1',
    };
    const testConfig = new Config(env);
    expect(testConfig.serperApiKey).toBe('test-serper-key');
    expect(testConfig.ceoDiscordUserIds).toEqual(['111', '222']);
    expect(testConfig.ceoOperatorIds).toContain('111');
    expect(testConfig.ceoOperatorIds).toContain('actor-1');
  });
});
