/**
 * @fileoverview 003-seed-sop-playbooks - Seeds default operational SOP playbooks.
 * @module database/seeds/003-seed-sop-playbooks
 */
'use strict';

module.exports = Object.freeze({
  id: "003-seed-sop-playbooks",
  description: "Initial eCommerce SOP playbooks",
  run: async (connection) => {
    const playbooks = [
      {
        sop_id: "sop_order_cancellation",
        title: "Standard Order Cancellation & Refund SOP",
        version: "1.0.0",
        steps_json: JSON.stringify([
          { step: 1, action: "validate_cancellation_eligibility", actor: "dan_cskh" },
          { step: 2, action: "process_inventory_restock", actor: "dan_logistics" },
          { step: 3, action: "issue_financial_refund", actor: "dan_cfo" }
        ])
      },
      {
        sop_id: "sop_inventory_reorder",
        title: "Automated Inventory Low-Stock Reorder SOP",
        version: "1.0.0",
        steps_json: JSON.stringify([
          { step: 1, action: "detect_threshold_breach", actor: "dan_logistics" },
          { step: 2, action: "request_budget_approval", actor: "dan_cfo" },
          { step: 3, action: "place_supplier_purchase_order", actor: "dan_ops" }
        ])
      }
    ];

    for (const pb of playbooks) {
      await connection.query(
        `INSERT INTO sop_playbooks
          (sop_id, title, version, steps_json, created_at, updated_at)
        VALUES
          (?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          steps_json = VALUES(steps_json),
          updated_at = CURRENT_TIMESTAMP(3)`,
        [pb.sop_id, pb.title, pb.version, pb.steps_json]
      );
    }
  }
});
