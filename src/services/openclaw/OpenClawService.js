'use strict';

const axios = require('axios');

/**
 * HTTP client wrapper for the OpenClaw microservice.
 * All endpoints require Bearer token authentication.
 */
class OpenClawService {
  /** @type {string} */
  #baseUrl;
  /** @type {string} */
  #secret;
  /** @type {number} */
  #timeout;
  #httpClient;

  /**
   * @param {string} baseUrl    e.g. "http://localhost:4000"
   * @param {string} secret     value of OPENCLAW_SECRET env var
   * @param {number} timeoutMs  default 30000
   */
  constructor(baseUrl, secret, timeoutMs = 30000, httpClient = axios) {
    this.#baseUrl  = baseUrl;
    this.#secret   = secret;
    this.#timeout  = timeoutMs;
    this.#httpClient = httpClient;
  }

  /**
   * Google Custom Search.
   * @param {string} query
   * @param {number} [num=5]
   * @returns {Promise<{ results: Array<{ title: string, link: string, snippet: string }> }>}
   */
  async search(query, num = 5) {
    const t0   = Date.now();
    const data = await this.#post('/search', { query, num });
    const time = Date.now() - t0;
    console.log(`[OpenClaw] search | query="${query.slice(0, 60)}" num=${num} results=${(data.results || []).length} time=${time}ms`);
    return data;
  }

  /**
   * Playwright headless crawl.
   * @param {string} url
   * @param {string|null} [selector=null]
   * @returns {Promise<{ title: string, text: string, url: string, httpStatus: number }>}
   */
  async crawl(url, selector = null) {
    const t0   = Date.now();
    const data = await this.#post('/crawl', { url, selector });
    const time = Date.now() - t0;
    console.log(`[OpenClaw] crawl | url="${url}" chars=${(data.text || '').length} time=${time}ms`);
    return data;
  }

  /**
   * Proxy an HTTP request.
   * @param {string} url
   * @param {string} [method='GET']
   * @param {object} [headers={}]
   * @param {*} [body=null]
   * @returns {Promise<{ status: number, data: any }>}
   */
  async fetch(url, method = 'GET', headers = {}, body = null) {
    return this.#post('/fetch', { url, method, headers, body });
  }

  /**
   * Playwright browser automation.
   * @param {string} url
   * @param {Array} steps
   * @returns {Promise<{ success: boolean, screenshot: string|null }>}
   */
  async automate(url, steps) {
    return this.#post('/automate', { url, steps });
  }

  async decideApproval(approvalId, {
    decision,
    decisionVersion,
    actorId,
    reason = null,
  }) {
    if (!approvalId) throw new TypeError('approvalId is required');
    return this.#post(
      `/orchestrator/v1/approvals/${encodeURIComponent(approvalId)}/decision`,
      { decision, decisionVersion, actorId, reason }
    );
  }

  async executeCeoCommand(commandName, {
    actorId,
    idempotencyKey,
    payload,
  }) {
    if (!commandName || !idempotencyKey) {
      throw new TypeError('commandName and idempotencyKey are required');
    }
    return this.#post(
      `/orchestrator/v1/commands/${encodeURIComponent(commandName)}`,
      { actorId, idempotencyKey, payload }
    );
  }

  async getDashboardOverview() {
    return this.#get('/orchestrator/v1/dashboard/overview');
  }

  async getCompanyDashboardStatus() {
    const response = await this.getDashboardOverview();
    const integration = response?.overview?.companyDashboard;
    if (!integration) {
      throw new Error('OpenClaw chưa nhận được trạng thái Dashboard công ty');
    }
    return integration;
  }

  async getCompanyDashboardTodayMetrics() {
    // The orchestrator-side SSOT adapter is the only component allowed to
    // call the company Dashboard API. It keeps credentials out of dan_ai.
    return this.#get('/orchestrator/v1/dashboard/company/today-metrics');
  }

  async getCompanyDashboardMetrics(period = 'today') {
    const query = new URLSearchParams({ period });
    return this.#get(`/orchestrator/v1/dashboard/company/metrics?${query.toString()}`);
  }

  async getDashboardAgents() {
    return this.#get('/orchestrator/v1/dashboard/agents');
  }

  async controlDashboardAgent(agentId, command) {
    if (!agentId) throw new TypeError('agentId is required');
    return this.#post(
      `/orchestrator/v1/dashboard/agents/${encodeURIComponent(agentId)}/control`,
      command,
    );
  }

  async getDashboardWorkflows({
    limit = 50,
    offset = 0,
    agentId = '',
    state = '',
    search = '',
  } = {}) {
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (agentId) query.set('agentId', agentId);
    if (state) query.set('state', state);
    if (search) query.set('search', search);
    return this.#get(`/orchestrator/v1/dashboard/workflows?${query.toString()}`);
  }

  async getDashboardWorkflowDetail(workflowId) {
    if (!workflowId) throw new TypeError('workflowId is required');
    return this.#get(
      `/orchestrator/v1/dashboard/workflows/${encodeURIComponent(workflowId)}`,
    );
  }

  async #get(path) {
    return this.#request('get', path);
  }

  /**
   * @param {string} path
   * @param {object} body
   */
  async #post(path, body) {
    return this.#request('post', path, body);
  }

  async #request(httpMethod, path, body = undefined) {
    const method = path.slice(1);
    try {
      const config = {
        headers: { Authorization: `Bearer ${this.#secret}` },
        timeout: this.#timeout,
      };
      const resp = httpMethod === 'get'
        ? await this.#httpClient.get(`${this.#baseUrl}${path}`, config)
        : await this.#httpClient.post(`${this.#baseUrl}${path}`, body, config);
      return resp.data;
    } catch (err) {
      // axios error response
      if (err.response) {
        const status = err.response.status;
        if (status === 401 || status === 403) {
          console.error(`[OpenClaw] auth failed (${status}) | OPENCLAW_SECRET không khớp — kiểm tra cấu hình env của OpenClaw`, err.response.data || err.message);
          throw new Error('OpenClaw auth failed (403)');
        }
        const msg = err.response.data?.error || err.message;
        console.error(`[OpenClaw] error | method=${method} status=${status} err="${msg}"`, err.response.data || err.message);
        throw new Error(msg);
      }
      // network error (ECONNREFUSED, timeout, etc.)
      console.error(`[OpenClaw] error | method=${method}`, err);
      throw err;
    }
  }
}

module.exports = OpenClawService;
