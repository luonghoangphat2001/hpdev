'use strict';

const { getAgentModel } = require('./agent-model.config');

const AGENTS = Object.freeze([
  Object.freeze({
    id: 'dan_rnd',
    department: 'rnd',
    mission: 'product_menu_research',
    version: '1.0.0',
    capabilities: Object.freeze(['menu_analysis', 'product_research']),
    permissions: Object.freeze(['product.read']),
    eventPatterns: Object.freeze(['product.*', 'productcategory.*']),
    actionPatterns: Object.freeze(['product.*']),
    routingPriority: 100,
    scope: Object.freeze(['products', 'menu', 'experiments']),
    kpis: Object.freeze(['menu_performance', 'proposal_acceptance', 'experiment_success']),
    prohibitions: Object.freeze(['business_state_write', 'price_change', 'product_publish']),
    escalationOwner: 'ceo',
    model: getAgentModel('dan_rnd'),
  }),
  Object.freeze({
    id: 'dan_logistics',
    department: 'logistics',
    mission: 'inventory_and_procurement',
    version: '1.0.0',
    capabilities: Object.freeze(['inventory_analysis', 'purchase_order_draft']),
    permissions: Object.freeze(['inventory.read', 'purchase_order_draft.create']),
    eventPatterns: Object.freeze(['product.*', 'inventory.*']),
    actionPatterns: Object.freeze(['inventory.*']),
    routingPriority: 90,
    scope: Object.freeze(['inventory', 'suppliers', 'purchase_order_drafts']),
    kpis: Object.freeze(['stockout_rate', 'inventory_turn', 'reorder_accuracy']),
    prohibitions: Object.freeze(['purchase_order_approve', 'supplier_payment']),
    escalationOwner: 'ceo',
    model: getAgentModel('dan_logistics'),
  }),
  Object.freeze({
    id: 'dan_cfo',
    department: 'finance',
    mission: 'finance_and_reconciliation',
    version: '1.0.0',
    capabilities: Object.freeze(['reconciliation', 'refund_proposal']),
    permissions: Object.freeze(['finance.read', 'refund.execute', 'order.read']),
    eventPatterns: Object.freeze(['order.created', 'finance.*']),
    actionPatterns: Object.freeze(['finance.*', 'order.*']),
    routingPriority: 80,
    scope: Object.freeze(['finance_summary', 'reconciliation', 'refund_proposals']),
    kpis: Object.freeze(['revenue', 'margin', 'reconciliation_variance', 'refund_rate']),
    prohibitions: Object.freeze(['bank_transfer', 'ledger_mutation', 'refund_without_approval']),
    escalationOwner: 'ceo',
    model: getAgentModel('dan_cfo'),
  }),
  Object.freeze({
    id: 'dan_ops',
    department: 'operations',
    mission: 'order_and_sla_operations',
    version: '1.0.0',
    capabilities: Object.freeze(['sla_monitoring', 'order_operations']),
    permissions: Object.freeze(['order.read', 'order_status.update']),
    eventPatterns: Object.freeze(['order.*']),
    actionPatterns: Object.freeze(['order.*', 'ops.*']),
    routingPriority: 100,
    scope: Object.freeze(['orders', 'sla', 'operational_exceptions']),
    kpis: Object.freeze(['order_cycle_time', 'sla_breach_rate', 'completion_rate']),
    prohibitions: Object.freeze(['raw_status_write', 'policy_override']),
    escalationOwner: 'ceo',
    model: getAgentModel('dan_ops'),
  }),
  Object.freeze({
    id: 'dan_cskh',
    department: 'customer_support',
    mission: 'customer_feedback_and_recovery',
    version: '1.0.0',
    capabilities: Object.freeze(['customer_recovery', 'voucher_proposal']),
    permissions: Object.freeze(['cskh.read', 'cskh_response.send', 'voucher.issue']),
    eventPatterns: Object.freeze(['customer_feedback.*']),
    actionPatterns: Object.freeze(['cskh.*']),
    routingPriority: 100,
    scope: Object.freeze(['customer_feedback', 'response_drafts', 'recovery_proposals']),
    kpis: Object.freeze(['response_sla', 'customer_satisfaction', 'recovery_rate']),
    prohibitions: Object.freeze(['customer_data_export', 'unapproved_high_value_voucher']),
    escalationOwner: 'ceo',
    model: getAgentModel('dan_cskh'),
  }),
]);

function routesFromAgents(agents, field) {
  const routes = new Map();
  agents.forEach((agent) => {
    (agent[field] || []).forEach((pattern) => {
      if (!routes.has(pattern)) routes.set(pattern, []);
      routes.get(pattern).push(agent.id);
    });
  });
  return Object.freeze(Array.from(routes, ([pattern, ids]) => Object.freeze({
    pattern,
    agents: Object.freeze(ids),
  })));
}

const EVENT_ROUTES = routesFromAgents(AGENTS, 'eventPatterns');
const ACTION_ROUTES = routesFromAgents(AGENTS, 'actionPatterns');

class AgentRegistry {
  constructor({
    agents = AGENTS,
    eventRoutes = null,
    actionRoutes = null,
  } = {}) {
    this.agents = new Map(agents.map((agent) => [agent.id, agent]));
    this.eventRoutes = eventRoutes || routesFromAgents(agents, 'eventPatterns');
    this.actionRoutes = actionRoutes || routesFromAgents(agents, 'actionPatterns');
    this.validate();
  }

  validate() {
    [...this.eventRoutes, ...this.actionRoutes].forEach((route) => {
      route.agents.forEach((agentId) => {
        if (!this.agents.has(agentId)) {
          throw new TypeError(`Route references unknown agent: ${agentId}`);
        }
      });
    });
  }

  get(agentId) {
    return this.agents.get(agentId) || null;
  }

  list() {
    return Array.from(this.agents.values());
  }

  routeEvent(eventName) {
    return this.route('event', eventName, this.eventRoutes);
  }

  routeAction(actionName) {
    return this.route('action', actionName, this.actionRoutes);
  }

  route(kind, name, routes) {
    const matched = routes.filter(({ pattern }) => this.matches(pattern, name));
    const agents = [...new Set(matched.flatMap((route) => route.agents))]
      .sort((left, right) =>
        (this.agents.get(right)?.routingPriority || 0)
        - (this.agents.get(left)?.routingPriority || 0));

    if (agents.length === 0) {
      return Object.freeze({
        status: 'dead_letter',
        reason: 'unknown_route',
        kind,
        name,
        agents: Object.freeze([]),
      });
    }

    return Object.freeze({
      status: 'routed',
      kind,
      name,
      agents: Object.freeze(agents),
    });
  }

  matches(pattern, value) {
    return pattern.endsWith('.*')
      ? value.startsWith(pattern.slice(0, -1))
      : pattern === value;
  }
}

module.exports = new AgentRegistry();
module.exports.AgentRegistry = AgentRegistry;
module.exports.AGENTS = AGENTS;
module.exports.EVENT_ROUTES = EVENT_ROUTES;
module.exports.ACTION_ROUTES = ACTION_ROUTES;
