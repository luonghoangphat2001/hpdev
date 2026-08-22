'use strict';

class OpenClawMonitorService {
  constructor(openClawClient, interactionRepository, { ceoActorId, configRepo = null } = {}) {
    if (!openClawClient || typeof openClawClient.getDashboardOverview !== 'function') {
      throw new TypeError('OpenClaw monitor requires an OpenClaw client');
    }
    this.openClawClient = openClawClient;
    this.interactionRepository = interactionRepository;
    this.ceoActorId = ceoActorId;
    this.configRepo = configRepo;
  }

  async getOverview() {
    const raw = await this.openClawClient.getDashboardOverview();
    // OpenClaw trả về raw object { service, status, operationalCounts, ... }
    // Frontend cần { ok: true, overview: { ... } }
    if (raw && (raw.ok !== undefined || raw.overview !== undefined)) {
      // Đã được wrap rồi (test double hoặc legacy) — trả thẳng
      return raw;
    }
    return {
      ok: true,
      overview: raw,
    };
  }

  async getAgents() {
    const response = await this.openClawClient.getDashboardAgents();
    let rawList = [];

    if (Array.isArray(response)) {
      rawList = response;
    } else if (Array.isArray(response?.agents)) {
      rawList = response.agents;
    }

    if (!this.configRepo) {
      return response;
    }

    const enriched = rawList.map((agent) => {
      const read = (role) => {
        return this.configRepo.get(`agent_${agent.agentId}_${role}`);
      };

      const parse = (value) => {
        const separator = String(value || '').indexOf(':');
        if (separator > 0) {
          return {
            provider: value.slice(0, separator),
            name: value.slice(separator + 1),
          };
        }
        return null;
      };

      const primary = parse(read('primary'));
      const fallback = parse(read('fallback'));

      if (primary && fallback) {
        return {
          ...agent,
          model: {
            primary,
            fallback,
          },
        };
      }

      return agent;
    });

    if (Array.isArray(response)) {
      return enriched;
    }

    return {
      ...response,
      agents: enriched,
    };
  }

  async controlAgent({ agentId, toState, expectedVersion, reason }) {
    if (!this.ceoActorId) {
      throw new Error('CEO dashboard actor ID is not configured');
    }
    return this.openClawClient.controlDashboardAgent(agentId, {
      toState,
      expectedVersion,
      actorId: this.ceoActorId,
      reason,
    });
  }

  async getWorkflows(query) {
    return this.openClawClient.getDashboardWorkflows(query);
  }

  async getWorkflowDetail(workflowId) {
    return this.openClawClient.getDashboardWorkflowDetail(workflowId);
  }

  async listInteractions(limit, offset) {
    if (!this.interactionRepository) {
      return {
        logs: [],
        total: 0,
      };
    }
    const [logs, total] = await Promise.all([
      this.interactionRepository.findRecent(limit, offset),
      this.interactionRepository.count(),
    ]);
    return {
      logs,
      total,
    };
  }
}

module.exports = OpenClawMonitorService;
