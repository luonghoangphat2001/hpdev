'use strict';

const { getSwaggerHtml, getOpenApiSpec } = require('@docs/swaggerUi');

describe('OpenClaw Swagger & OpenAPI Docs', () => {
  test('getSwaggerHtml returns valid Swagger UI HTML page', () => {
    const html = getSwaggerHtml();
    expect(typeof html).toBe('string');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('SwaggerUIBundle');
    expect(html).toContain('/docs/spec');
  });

  test('getOpenApiSpec returns valid OpenAPI 3.0.3 spec object', () => {
    const spec = getOpenApiSpec();
    expect(spec).toBeDefined();
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toBe('OpenClaw Microservice API');
    expect(spec.paths['/search']).toBeDefined();
    expect(spec.paths['/fetch']).toBeDefined();
    expect(spec.paths['/crawl']).toBeDefined();
    expect(spec.paths['/automate']).toBeDefined();
    expect(spec.paths['/orchestrator/v1/control/status']).toBeDefined();
  });
});
