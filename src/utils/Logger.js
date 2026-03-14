'use strict';

const fs   = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');

/**
 * File logger: patches console.log/warn/error so every output
 * is simultaneously written to logs/YYYY-MM-DD.log.
 *
 * Call Logger.init() once at boot (bot.js / app.js).
 * Everything after that is automatic — no code changes needed elsewhere.
 */
class Logger {
  /** @type {fs.WriteStream|null} */
  static #stream = null;
  /** @type {string} */
  static #currentDate = '';

  static init() {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

    Logger.#openStream();

    // Patch console methods
    const orig = {
      log:   console.log.bind(console),
      warn:  console.warn.bind(console),
      error: console.error.bind(console),
      info:  console.info.bind(console),
    };

    const write = (level, args) => {
      const line = Logger.#format(level, args);
      Logger.#write(line);
    };

    console.log   = (...a) => { orig.log(...a);   write('INFO',  a); };
    console.info  = (...a) => { orig.info(...a);  write('INFO',  a); };
    console.warn  = (...a) => { orig.warn(...a);  write('WARN',  a); };
    console.error = (...a) => { orig.error(...a); write('ERROR', a); };

    // Also capture unhandled errors
    process.on('uncaughtException',  (err) => { console.error('[Process] uncaughtException:', err); });
    process.on('unhandledRejection', (err) => { console.error('[Process] unhandledRejection:', err); });

    console.log('[Logger] Initialized — log dir:', LOG_DIR);
  }

  static #format(level, args) {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 23);
    const msg = args.map((a) => {
      if (a instanceof Error) return a.stack || a.message;
      if (typeof a === 'object' && a !== null) {
        try { return JSON.stringify(a); } catch { return String(a); }
      }
      return String(a);
    }).join(' ');
    return `[${ts}] [${level}] ${msg}\n`;
  }

  static #write(line) {
    const today = new Date().toISOString().slice(0, 10);

    // Rotate file if date has changed
    if (today !== Logger.#currentDate) {
      Logger.#openStream(today);
    }

    if (Logger.#stream) {
      Logger.#stream.write(line);
    }
  }

  static #openStream(date) {
    const today = date || new Date().toISOString().slice(0, 10);
    if (Logger.#stream) Logger.#stream.end();
    const file = path.join(LOG_DIR, `${today}.log`);
    Logger.#stream = fs.createWriteStream(file, { flags: 'a', encoding: 'utf8' });
    Logger.#currentDate = today;
  }

  /**
   * List available log files, newest first.
   * @returns {{ filename: string, date: string, sizeBytes: number }[]}
   */
  static listFiles() {
    if (!fs.existsSync(LOG_DIR)) return [];
    return fs.readdirSync(LOG_DIR)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.log$/.test(f))
      .sort()
      .reverse()
      .map((f) => {
        const stat = fs.statSync(path.join(LOG_DIR, f));
        return { filename: f, date: f.replace('.log', ''), sizeBytes: stat.size };
      });
  }

  /**
   * Absolute path to a log file (validated to stay inside LOG_DIR).
   * Returns null if the file doesn't exist or path is invalid.
   * @param {string} filename  e.g. "2026-03-15.log"
   * @returns {string|null}
   */
  static filePath(filename) {
    if (!/^\d{4}-\d{2}-\d{2}\.log$/.test(filename)) return null;
    const full = path.join(LOG_DIR, filename);
    return fs.existsSync(full) ? full : null;
  }
}

module.exports = Logger;
