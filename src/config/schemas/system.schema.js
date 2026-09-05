'use strict';

const Logger = require('@utils/Logger');

/**
 * Schema definitions for system persona prompt and log maintenance.
 */
const SYSTEM_CONFIG_SCHEMA = [
  // Persona Prompt
  {
    key: 'system_prompt',
    type: 'text',
    category: 'system_core',
  },

  // Log Retention with Auto-Cleanup Hook
  {
    key: 'log_retention_days',
    type: 'number',
    defaultValue: 14,
    category: 'system_maintenance',
    transform: (val) => {
      return String(Math.max(1, Number(val) || 14));
    },
    onUpdate: (days) => {
      Logger.cleanOldLogs(Number(days));
    },
  },
];

module.exports = {
  SYSTEM_CONFIG_SCHEMA,
};
