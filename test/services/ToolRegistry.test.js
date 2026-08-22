'use strict';

const ToolRegistry = require('../../src/services/ai/ToolRegistry');

const EXPECTED_NAMES = ['web_search', 'web_crawl', 'http_fetch', 'browser_automate', 'save_memory', 'recall_memory', 'company_dashboard_metrics', 'schedule_manage'];

describe('ToolRegistry.forGemini()', () => {
  let tools;
  beforeEach(() => { tools = ToolRegistry.forGemini(); });

  test('returns the registered tools', () => {
    expect(Array.isArray(tools)).toBe(true);
    expect(tools).toHaveLength(EXPECTED_NAMES.length);
  });

  test('each tool has name, description, parameters', () => {
    for (const t of tools) {
      expect(typeof t.name).toBe('string');
      expect(typeof t.description).toBe('string');
      expect(t.parameters).toBeDefined();
      expect(t.parameters.type).toBe('OBJECT');
      expect(t.parameters.properties).toBeDefined();
    }
  });

  test('tool names match expected set', () => {
    expect(tools.map(t => t.name).sort()).toEqual(EXPECTED_NAMES.sort());
  });

  test('web_search requires query param', () => {
    const t = tools.find(t => t.name === 'web_search');
    expect(t.parameters.required).toContain('query');
  });

  test('web_crawl requires url param', () => {
    const t = tools.find(t => t.name === 'web_crawl');
    expect(t.parameters.required).toContain('url');
  });
});

describe('ToolRegistry.forClaude()', () => {
  let tools;
  beforeEach(() => { tools = ToolRegistry.forClaude(); });

  test('returns the registered tools', () => {
    expect(tools).toHaveLength(EXPECTED_NAMES.length);
  });

  test('each tool has name, description, input_schema', () => {
    for (const t of tools) {
      expect(typeof t.name).toBe('string');
      expect(typeof t.description).toBe('string');
      expect(t.input_schema).toBeDefined();
      expect(t.input_schema.type).toBe('object');
    }
  });

  test('tool names match expected set', () => {
    expect(tools.map(t => t.name).sort()).toEqual(EXPECTED_NAMES.sort());
  });
});

describe('ToolRegistry.forChatGPT()', () => {
  let tools;
  beforeEach(() => { tools = ToolRegistry.forChatGPT(); });

  test('returns the registered tools', () => {
    expect(tools).toHaveLength(EXPECTED_NAMES.length);
  });

  test('each tool has type "function" and function.name', () => {
    for (const t of tools) {
      expect(t.type).toBe('function');
      expect(typeof t.function.name).toBe('string');
      expect(t.function.parameters.type).toBe('object');
    }
  });

  test('tool names match expected set', () => {
    expect(tools.map(t => t.function.name).sort()).toEqual(EXPECTED_NAMES.sort());
  });
});
