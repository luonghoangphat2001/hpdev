'use strict';

const config = require('@config');
const { EnvReader } = require('@config');

describe('config', () => {
  describe('EnvReader', () => {
    test('requireString validates correctly', () => {
      const reader = new EnvReader({ FOO: 'bar' });
      expect(reader.requireString('FOO')).toBe('bar');
      expect(() => new EnvReader({}).requireString('FOO')).toThrow(
        '[Config] Missing required environment variable: FOO'
      );
    });

    test('requireNumber validates correctly', () => {
      const reader = new EnvReader({ PORT: '3000' });
      expect(reader.requireNumber('PORT')).toBe(3000);
      expect(() => new EnvReader({ PORT: 'invalid' }).requireNumber('PORT')).toThrow(
        '[Config] Environment variable PORT must be a valid number'
      );
    });

    test('requireBoolean validates correctly', () => {
      expect(new EnvReader({ B: 'true' }).requireBoolean('B')).toBe(true);
      expect(new EnvReader({ B: '1' }).requireBoolean('B')).toBe(true);
      expect(new EnvReader({ B: 'false' }).requireBoolean('B')).toBe(false);
      expect(new EnvReader({ B: '0' }).requireBoolean('B')).toBe(false);
      expect(() => new EnvReader({ B: 'maybe' }).requireBoolean('B')).toThrow(
        "[Config] Environment variable B must be a boolean ('true' or 'false')"
      );
    });

    test('requireUrl normalizes clean url', () => {
      const reader = new EnvReader({ URL: 'https://api.example.com/' });
      expect(reader.requireUrl('URL')).toBe('https://api.example.com');
      expect(() => new EnvReader({ URL: 'ftp://api.example.com' }).requireUrl('URL')).toThrow(
        '[Config] Invalid URL for environment variable URL'
      );
    });

    test('requireArray splits and validates array', () => {
      const reader = new EnvReader({ CORS: 'http://a, http://b' });
      expect(reader.requireArray('CORS')).toEqual(['http://a', 'http://b']);
      expect(() => new EnvReader({}).requireArray('CORS')).toThrow(
        '[Config] Missing required environment variable: CORS'
      );
    });
  });

  describe('configuration Value Objects', () => {
    test('exposes populated, frozen server, database, auth, ai, openclaw Value Objects', () => {
      expect(config.server).toBeDefined();
      expect(typeof config.server.port).toBe('number');
      expect(Object.isFrozen(config.server)).toBe(true);

      expect(config.database).toBeDefined();
      expect(config.database.host).toBeDefined();
      expect(Object.isFrozen(config.database)).toBe(true);

      expect(config.auth).toBeDefined();
      expect(config.auth.sessionSecret).toBeDefined();
      expect(Object.isFrozen(config.auth)).toBe(true);

      expect(config.cors).toBeDefined();
      expect(Array.isArray(config.cors.origins)).toBe(true);
      expect(Object.isFrozen(config.cors)).toBe(true);

      expect(config.ai).toBeDefined();
      expect(Object.isFrozen(config.ai)).toBe(true);

      expect(config.openclaw).toBeDefined();
      expect(Object.isFrozen(config.openclaw)).toBe(true);
    });
  });
});
