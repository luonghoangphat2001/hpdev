/**
 * @fileoverview kpi.catalog - Provides kpi functionality.
 */
'use strict';

const kpiDictionary = Object.freeze({
  'rnd.proposal_acceptance_rate': {
    name: 'R&D Proposal Acceptance Rate',
    ownerAgent: 'dan_rnd',
    frequency: 'weekly',
    target: 0.8,
    formula: 'acceptedProposals / totalProposals',
    dataSource: 'openclaw_orchestrator',
  },
  'logistics.stockout_rate': {
    name: 'Logistics Stockout Rate',
    ownerAgent: 'dan_logistics',
    frequency: 'daily',
    target: 0.02,
    formula: 'stockoutItems / totalManagedItems',
    dataSource: 'ssot_inventory',
  },
  'cfo.gross_margin': {
    name: 'CFO Gross Margin',
    ownerAgent: 'dan_cfo',
    frequency: 'daily',
    target: 0.65,
    formula: '(revenue - cogs) / revenue',
    dataSource: 'ssot_finance',
  },
  'ops.sla_compliance_rate': {
    name: 'Ops SLA Compliance Rate',
    ownerAgent: 'dan_ops',
    frequency: 'daily',
    target: 0.95,
    formula: 'onTimeOrders / totalCompletedOrders',
    dataSource: 'ssot_orders',
  },
  'cskh.customer_satisfaction_score': {
    name: 'CSKH CSAT Score',
    ownerAgent: 'dan_cskh',
    frequency: 'daily',
    target: 4.5,
    formula: 'totalRatingSum / totalRatingCount',
    dataSource: 'ssot_reviews',
  },
});

function getKpiDefinition(kpiKey) {
  const def = kpiDictionary[kpiKey];
  if (!def) throw new Error(`Unknown KPI key: ${kpiKey}`);
  return def;
}

module.exports = {
  kpiDictionary,
  getKpiDefinition,
};
