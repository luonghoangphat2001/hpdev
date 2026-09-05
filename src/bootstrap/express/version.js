'use strict';

const { execFileSync } = require('child_process');

function resolveVersion() {
  if (process.env.APP_VERSION) return process.env.APP_VERSION;
  if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT;

  try {
    const gitVersion = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
    if (gitVersion) return gitVersion;
  } catch (_) {
    // git not available in some container environments
  }
  return '2.0.0';
}

module.exports = resolveVersion();
