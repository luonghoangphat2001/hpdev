'use strict';

const fs = require('fs');
const path = require('path');
const Logger = require('../../src/utils/Logger');

describe('Logger utility', () => {
  const logDir = path.join(__dirname, '../../logs');

  beforeAll(() => {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  });

  test('cleanOldLogs removes log files older than retention days and keeps recent ones', () => {
    // Create an old file (60 days ago) and a recent file (yesterday)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);
    const oldFileName = `${oldDate.toISOString().slice(0, 10)}.log`;
    const oldFilePath = path.join(logDir, oldFileName);

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 1);
    const recentFileName = `${recentDate.toISOString().slice(0, 10)}.log`;
    const recentFilePath = path.join(logDir, recentFileName);

    fs.writeFileSync(oldFilePath, 'old log content', 'utf8');
    fs.writeFileSync(recentFilePath, 'recent log content', 'utf8');

    expect(fs.existsSync(oldFilePath)).toBe(true);
    expect(fs.existsSync(recentFilePath)).toBe(true);

    const result = Logger.cleanOldLogs(14);

    expect(result.deletedFiles).toContain(oldFileName);
    expect(result.deletedFiles).not.toContain(recentFileName);
    expect(fs.existsSync(oldFilePath)).toBe(false);
    expect(fs.existsSync(recentFilePath)).toBe(true);

    // Cleanup recent test file
    try {
      fs.unlinkSync(recentFilePath);
    } catch (_) {}
  });

  test('listFiles returns available log files', () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayFile = path.join(logDir, `${today}.log`);
    fs.writeFileSync(todayFile, 'today log content', 'utf8');

    const files = Logger.listFiles();
    expect(Array.isArray(files)).toBe(true);
    const found = files.find((f) => f.filename === `${today}.log`);
    expect(found).toBeDefined();
    expect(found.source).toBe('app');
  });

  test('filePath validates path strictly', () => {
    const invalidPath = Logger.filePath('../../../etc/passwd');
    expect(invalidPath).toBeNull();
  });
});
