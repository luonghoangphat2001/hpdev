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
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.sendFile(filePath);
  };
}

module.exports = LogController;
