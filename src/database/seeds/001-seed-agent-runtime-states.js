/**
 * @fileoverview 001-seed-agent-runtime-states - Seeds default runtime lifecycle states for registered agents.
 * @module database/seeds/001-seed-agent-runtime-states
 */
'use strict';

module.exports = Object.freeze({
  id: "001-seed-agent-runtime-states",
  description: "Initial runtime states for registered 5 Dan agents",
  run: async (connection) => {
    const agents = ["dan_rnd", "dan_logistics", "dan_cfo", "dan_ops", "dan_cskh"];
    for (const agentId of agents) {
      await connection.query(
        `INSERT INTO agent_runtime_states
          (agent_id, lifecycle_state, state_version, reason, changed_by, changed_at)
        VALUES
          (?, "ACTIVE", 1, "Initial registered state", "system", CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE
          updated_at = CURRENT_TIMESTAMP(3)`,
        [agentId]
      );
    }
  }
});
