'use strict';

const DashboardTemplate = require('../src/utils/DashboardTemplate');

console.log('[Build] Verifying and warming MPA page templates...');
const pages = [
  'chat',
  'learning',
  'tech',
  'vocabulary',
  'quiz',
  'study',
  'history',
  'stats',
  'users',
  'openclaw',
  'logs',
  'config',
  'login',
];

for (const page of pages) {
  const html = DashboardTemplate.renderPage(page, { cache: true });
  console.log(`[Build] ✓ ${page}.html compiled (${html.length} bytes)`);
}

console.log('[Build] ✓ All MPA pages successfully verified!');
