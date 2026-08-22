'use strict';

const Logger = require('../utils/Logger');

/**
 * Admin-only endpoints for viewing and downloading daily log files.
 */
class LogController {
  /** GET /api/logs — list available log files */
  list = (_req, res) => {
    res.json(Logger.listFiles());
  };

  /** GET /api/logs/:filename — download a log file */
  download = (req, res) => {
    const { filename } = req.params;
    const filePath = Logger.filePath(filename);
    if (!filePath) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    res.download(filePath, filename);
  };

  /** GET /api/logs/:filename/content — view log inline (no download) */
  view = (req, res) => {
    const { filename } = req.params;
    const filePath = Logger.filePath(filename);
    if (!filePath) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    res.type('text/plain; charset=utf-8');
    res.sendFile(filePath);
  };

  /** POST /api/logs/clean — trigger retention cleanup */
  clean = (req, res) => {
    const days = req.body?.days || req.query?.days || null;
    const result = Logger.cleanOldLogs(days);
    res.json({ ok: true, ...result });
  };
}

module.exports = LogController;
