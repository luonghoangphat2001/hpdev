'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Generates the HTML string to serve Swagger UI for Frontend developers.
 * @returns {string}
 */
function getSwaggerHtml() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đần AI Platform - API Documentation (Swagger)</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #0f172a; color: #f8fafc; font-family: sans-serif; }
    .topbar { display: none !important; }
    .swagger-ui .info .title { color: #38bdf8; font-weight: 700; }
    .swagger-ui .info p, .swagger-ui .info li { color: #cbd5e1; }
    .swagger-ui .scheme-container { background: #1e293b; box-shadow: none; border-bottom: 1px solid #334155; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/spec',
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
 * Loads the OpenAPI 3.0.3 specification JSON.
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
