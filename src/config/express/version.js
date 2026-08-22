'use strict';

const { execFileSync } = require('child_process');
const pkg = require('../../../package.json');

function resolveVersion() {
  if (process.env.APP_VERSION) return process.env.APP_VERSION;
  if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT;

  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim() || pkg.version || '2.0.0';
  } catch (_) {
    return pkg.version || '2.0.0';
  }
}

module.exports = resolveVersion();
