'use strict';

const { shouldSkipApiRateLimit } = require('../../src/config/express/request');

describe('API rate-limit exemptions', () => {
  test.each(['/me', '/health'])('keeps bootstrap endpoint %s reachable', (path) => {
    expect(shouldSkipApiRateLimit({ path })).toBe(true);
  });

  test.each(['/learning', '/quiz', '/config'])('continues limiting data endpoint %s', (path) => {
    expect(shouldSkipApiRateLimit({ path })).toBe(false);
  });
});
