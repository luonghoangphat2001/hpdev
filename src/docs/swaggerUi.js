'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Generates the HTML string to serve Swagger UI for OpenClaw.
 * @returns {string}
 */
function getSwaggerHtml() {
  let cssUrl;
  let bundleJsUrl;
  let presetJsUrl;

  try {
    cssUrl = process.env.SWAGGER_UI_CSS_URL;
    if (!cssUrl || typeof cssUrl !== 'string' || cssUrl.trim().length === 0) {
      throw new Error('SWAGGER_UI_CSS_URL is required in environment');
    }
    bundleJsUrl = process.env.SWAGGER_UI_BUNDLE_JS_URL;
    if (!bundleJsUrl || typeof bundleJsUrl !== 'string' || bundleJsUrl.trim().length === 0) {
      throw new Error('SWAGGER_UI_BUNDLE_JS_URL is required in environment');
    }
    presetJsUrl = process.env.SWAGGER_UI_STANDALONE_PRESET_JS_URL;
    if (!presetJsUrl || typeof presetJsUrl !== 'string' || presetJsUrl.trim().length === 0) {
      throw new Error('SWAGGER_UI_STANDALONE_PRESET_JS_URL is required in environment');
    }
  } catch (error) {
    throw new Error(`[SwaggerUI] Failed to load Swagger assets from env: ${error.message}`);
  }

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenClaw Engine - Swagger API Docs</title>
  <link rel="stylesheet" href="${cssUrl}" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #0b132b; color: #f8fafc; font-family: sans-serif; }
    .topbar { display: none !important; }
    .swagger-ui .info .title { color: #48cae4; font-weight: 700; }
    .swagger-ui .info p, .swagger-ui .info li { color: #cbd5e1; }
    .swagger-ui .scheme-container { background: #1c2541; box-shadow: none; border-bottom: 1px solid #3a506b; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${bundleJsUrl}"></script>
  <script src="${presetJsUrl}"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: '/docs/spec',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: 'StandaloneLayout',
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Loads the OpenClaw OpenAPI 3.0.3 specification JSON.
 * @returns {object}
 */
function getOpenApiSpec() {
  const specPath = path.join(__dirname, 'openapi.json');
  const raw = fs.readFileSync(specPath, 'utf8');
  return JSON.parse(raw);
}

module.exports = {
  getSwaggerHtml,
  getOpenApiSpec,
};
