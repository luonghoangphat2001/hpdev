'use strict';

const AGENTS = Object.freeze([
  Object.freeze({
    id: 'dan_rnd',
    department: 'rnd',
    mission: 'product_menu_research',
  }),
  Object.freeze({
    id: 'dan_logistics',
    department: 'logistics',
    mission: 'inventory_and_procurement',
  }),
  Object.freeze({
    id: 'dan_cfo',
    department: 'finance',
    mission: 'finance_and_reconciliation',
  }),
  Object.freeze({
    id: 'dan_ops',
    department: 'operations',
    mission: 'order_and_sla_operations',
  }),
  Object.freeze({
    id: 'dan_cskh',
    department: 'customer_support',
    mission: 'customer_feedback_and_recovery',
  }),
]);

const EVENT_ROUTES = Object.freeze([
  Object.freeze({ pattern: 'product.*', agents: Object.freeze(['dan_rnd', 'dan_logistics']) }),
  Object.freeze({ pattern: 'productcategory.*', agents: Object.freeze(['dan_rnd']) }),
  Object.freeze({ pattern: 'order.created', agents: Object.freeze(['dan_ops', 'dan_cfo']) }),
  Object.freeze({ pattern: 'order.*', agents: Object.freeze(['dan_ops']) }),
  Object.freeze({ pattern: 'inventory.*', agents: Object.freeze(['dan_logistics']) }),
  Object.freeze({ pattern: 'finance.*', agents: Object.freeze(['dan_cfo']) }),
  Object.freeze({ pattern: 'customer_feedback.*', agents: Object.freeze(['dan_cskh']) }),
]);

const ACTION_ROUTES = Object.freeze([
  Object.freeze({ pattern: 'order.*', agents: Object.freeze(['dan_ops', 'dan_cfo']) }),
  Object.freeze({ pattern: 'inventory.*', agents: Object.freeze(['dan_logistics']) }),
  Object.freeze({ pattern: 'finance.*', agents: Object.freeze(['dan_cfo']) }),
  Object.freeze({ pattern: 'ops.*', agents: Object.freeze(['dan_ops']) }),
  Object.freeze({ pattern: 'cskh.*', agents: Object.freeze(['dan_cskh']) }),
  Object.freeze({ pattern: 'product.*', agents: Object.freeze(['dan_rnd']) }),
]);

class AgentRegistry {
  constructor({
    agents = AGENTS,
    eventRoutes = EVENT_ROUTES,
    actionRoutes = ACTION_ROUTES,
  } = {}) {
    this.agents = new Map(agents.map((agent) => [agent.id, agent]));
    this.eventRoutes = eventRoutes;
    this.actionRoutes = actionRoutes;
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
    const agents = [...new Set(matched.flatMap((route) => route.agents))];

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
