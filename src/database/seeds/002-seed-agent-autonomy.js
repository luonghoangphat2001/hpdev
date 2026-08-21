/**
 * @fileoverview 002-seed-agent-autonomy - Seeds default autonomy policies for registered agents.
 * @module database/seeds/002-seed-agent-autonomy
 */
'use strict';

module.exports = Object.freeze({
  id: "002-seed-agent-autonomy",
  description: "Initial autonomy level settings for 5 agents",
  run: async (connection) => {
    const defaultSettings = [
      { agent_id: "dan_rnd", autonomy_level: "AUTONOMOUS", max_budget_usd: 50.0 },
      { agent_id: "dan_logistics", autonomy_level: "SEMI_AUTONOMOUS", max_budget_usd: 100.0 },
      { agent_id: "dan_cfo", autonomy_level: "MANUAL_APPROVAL", max_budget_usd: 500.0 },
      { agent_id: "dan_ops", autonomy_level: "SEMI_AUTONOMOUS", max_budget_usd: 150.0 },
      { agent_id: "dan_cskh", autonomy_level: "AUTONOMOUS", max_budget_usd: 30.0 }
    ];

    for (const setting of defaultSettings) {
      await connection.query(
        `INSERT INTO agent_autonomy_settings
          (agent_id, autonomy_level, max_budget_usd, created_at, updated_at)
        VALUES
          (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE
          autonomy_level = VALUES(autonomy_level),
          max_budget_usd = VALUES(max_budget_usd),
          updated_at = CURRENT_TIMESTAMP(3)`,
        [setting.agent_id, setting.autonomy_level, setting.max_budget_usd]
      );
    }
  }
});
