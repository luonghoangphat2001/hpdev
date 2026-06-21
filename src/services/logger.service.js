'use strict';

const fs = require('fs');
const path = require('path');

class LoggerService {
  constructor(logFile = path.resolve(__dirname, '../../.log')) {
    this.logFile = logFile;
  }

  info(message, context = {}) {
    this.write('info', message, context);
  }

  error(message, context = {}) {
    this.write('error', message, context);
  }

  write(level, message, context = {}) {
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    try {
      fs.appendFileSync(this.logFile, `${JSON.stringify(entry)}\n`, 'utf8');
    } catch (err) {
      console.error(`[OpenClaw] Failed to write ${this.logFile}: ${err.message}`);
    }
  }

  formatError(err) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode || err.response?.status,
      details: err.details,
    };
  }
}

module.exports = new LoggerService();
module.exports.LoggerService = LoggerService;
