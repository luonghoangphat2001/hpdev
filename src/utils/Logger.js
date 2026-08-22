'use strict';

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const ROOT_LOG_FILES = [
  'stderr.log',
];

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

  static init(retentionDays = null) {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    Logger.#openStream();
    Logger.cleanOldLogs(retentionDays);

    // Patch console methods
    const orig = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
    };

    const write = (level, args) => {
      const line = Logger.#format(level, args);
      Logger.#write(line);
    };

    console.log = (...a) => {
      orig.log(...a);
      write('INFO', a);
    };

    console.info = (...a) => {
      orig.info(...a);
      write('INFO', a);
    };

    console.warn = (...a) => {
      orig.warn(...a);
      write('WARN', a);
    };

    console.error = (...a) => {
      orig.error(...a);
      write('ERROR', a);
    };

    // Also capture unhandled errors
    process.on('uncaughtException', (err) => {
      console.error('[Process] uncaughtException:', err);
      process.exit(1);
    });

    process.on('unhandledRejection', (err) => {
      console.error('[Process] unhandledRejection:', err);
      process.exit(1);
    });

    console.log('[Logger] Initialized — log dir:', LOG_DIR);
  }

  static #format(level, args) {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 23);
    const msg = args
      .map((a) => {
        if (a instanceof Error) {
          return a.stack || a.message;
        }
        if (typeof a === 'object' && a !== null) {
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        }
        return String(a);
      })
      .join(' ');

    return `[${ts}] [${level}] ${msg}\n`;
  }

  static #write(line) {
    const today = new Date().toISOString().slice(0, 10);

    // Rotate file if date has changed
    if (today !== Logger.#currentDate) {
      Logger.#openStream(today);
      Logger.cleanOldLogs();
    }

    if (Logger.#stream) {
      Logger.#stream.write(line);
    }
  }

  static #openStream(date) {
    const today = date || new Date().toISOString().slice(0, 10);
    if (Logger.#stream) {
      Logger.#stream.end();
    }

    const file = path.join(LOG_DIR, `${today}.log`);
    Logger.#stream = fs.createWriteStream(file, {
      flags: 'a',
      encoding: 'utf8',
    });
    Logger.#currentDate = today;
  }

  /**
   * Remove daily log files older than the specified retention days.
   * @param {number} [days] Default: process.env.LOG_RETENTION_DAYS or 14
   * @returns {{ deletedCount: number, deletedFiles: string[], retentionDays: number }}
   */
  static cleanOldLogs(days = null) {
    const retentionDays = Math.max(1, Number(days || process.env.LOG_RETENTION_DAYS || 14));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    const deletedFiles = [];
    if (fs.existsSync(LOG_DIR)) {
      try {
        const files = fs.readdirSync(LOG_DIR);
        for (const file of files) {
          const match = file.match(/^(\d{4}-\d{2}-\d{2})\.log$/);
          if (match) {
            const fileDate = match[1];
            if (fileDate < cutoffStr) {
              const fullPath = path.join(LOG_DIR, file);
              try {
                fs.unlinkSync(fullPath);
                deletedFiles.push(file);
              } catch (_) {}
            }
          }
        }
      } catch (_) {}
    }

    if (deletedFiles.length > 0) {
      console.log(`[Logger] Cleaned up ${deletedFiles.length} log files older than ${retentionDays} days: ${deletedFiles.join(', ')}`);
    }

    return {
      deletedCount: deletedFiles.length,
      deletedFiles,
      retentionDays,
    };
  }

  /**
   * List available log files, newest first.
   * @returns {{ filename: string, date: string, sizeBytes: number }[]}
   */
  static listFiles() {
    const files = [];

    if (fs.existsSync(LOG_DIR)) {
      const dirFiles = fs
        .readdirSync(LOG_DIR)
        .filter((name) => {
          return /^\d{4}-\d{2}-\d{2}\.log$/.test(name);
        })
        .sort()
        .reverse();

      for (const f of dirFiles) {
        const full = path.join(LOG_DIR, f);
        const stat = fs.statSync(full);
        files.push({
          filename: f,
          date: f.replace('.log', ''),
          sizeBytes: stat.size,
          source: 'app',
        });
      }
    }

    for (const filename of ROOT_LOG_FILES) {
      const full = path.join(__dirname, '../../', filename);
      if (!fs.existsSync(full)) {
        continue;
      }
      const stat = fs.statSync(full);
      files.push({
        filename,
        date: filename.replace('.log', ''),
        sizeBytes: stat.size,
        source: 'server',
      });
    }

    return files;
  }

  /**
   * Absolute path to a log file (validated to stay inside LOG_DIR).
   * Returns null if the file doesn't exist or path is invalid.
   * @param {string} filename  e.g. "2026-03-15.log"
   * @returns {string|null}
   */
  static filePath(filename) {
    const isDaily = /^\d{4}-\d{2}-\d{2}\.log$/.test(filename);
    const isRoot = ROOT_LOG_FILES.includes(filename);
    if (!isDaily && !isRoot) {
      return null;
    }

    const full = isDaily
      ? path.join(LOG_DIR, filename)
      : path.join(__dirname, '../../', filename);

    if (fs.existsSync(full)) {
      return full;
    }

    return null;
  }
}

module.exports = Logger;
