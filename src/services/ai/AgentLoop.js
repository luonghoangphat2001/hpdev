'use strict';

/** Maximum number of tool-call iterations before forcing a final text response. */
// Keep multi-topic Telegram requests within Gemini's quota window while still
// allowing one search round and one refinement round before final synthesis.
const MAX_ITERATIONS = 2;

/**
 * Drives a multi-turn AI agent loop.
 *
 * Each iteration:
 *   1. Calls provider.chatWithTools(messages, systemPrompt)
 *   2. If the response is text → done, return it.
 *   3. If the response is tool_calls → execute each tool via OpenClawService,
 *      append both the assistant's tool-call turn and the tool results turn to
 *      the message history, then loop.
 *
 * After MAX_ITERATIONS, falls back to provider.chat() with a summary instruction.
 */
class AgentLoop {
  /** @type {import('./ai/AIProvider')} */
  #provider;
  /** @type {import('./OpenClawService')} */
  #openClaw;
  /** @type {import('../models/InsightRepository')|null} */
  #insightRepo;
  /** @type {import('./SchedulerService')|null} */
  #scheduler;
  /** @type {{userId: string, platform: string, channelId: string}|null} */
  #context = null;

  /**
   * @param {import('./ai/AIProvider')} provider
   * @param {import('./OpenClawService')} openClawService
   * @param {import('../models/InsightRepository')|null} insightRepo
   */
  constructor(provider, openClawService, insightRepo = null, schedulerService = null) {
    this.#provider    = provider;
    this.#openClaw    = openClawService;
    this.#insightRepo = insightRepo;
    this.#scheduler = schedulerService;
  }

  /**
   * Run the agent loop until a final text response or MAX_ITERATIONS.
   *
   * @param {Array<{role: string, content?: string}>} messages  Initial message history.
   * @param {string} systemPrompt
   * @param {{userId: string, platform: string, channelId: string}|null} context
   * @returns {Promise<{ text: string, tokensIn: number, tokensOut: number }>}
   */
  async run(messages, systemPrompt, context = null) {
    this.#context = context;
    let current  = [...messages];
    let totalIn  = 0;
    let totalOut = 0;
    const allowedToolNames = await this.#routeCapability(messages);

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      // Side-effecting/internal capabilities must be single-shot. The next
      // round is only for summarising the tool result; exposing the same
      // mutation tool again can create duplicate reminders or actions.
      const isRestricted = Array.isArray(allowedToolNames);
      const roundTools = iter > 0 && isRestricted && allowedToolNames.some((name) =>
        ['schedule_manage', 'company_dashboard_metrics'].includes(name)
      ) ? [] : allowedToolNames;
      const round = await this.#provider.chatWithTools(current, systemPrompt, {
        allowedToolNames: roundTools,
        requireToolCall: iter === 0 && isRestricted && roundTools.length > 0,
      });
      totalIn  += round.tokensIn  || 0;
      totalOut += round.tokensOut || 0;

      if (round.type === 'text') {
        return { text: round.text, tokensIn: totalIn, tokensOut: totalOut };
      }

      if (round.type === 'tool_calls') {
        const names = round.toolCalls.map((c) => c.name).join(', ');
        console.log(`[AgentLoop] iter=${iter + 1} tools=[${names}]`);

        // Execute all requested tools
        const toolResults = await Promise.all(
          round.toolCalls.map(async (call) => {
            const content = await this.#executeTool(call.name, call.args);
            return { id: call.id, name: call.name, content };
          })
        );

        const actionText = this.#formatCompletedAction(toolResults);
        if (actionText) {
          return { text: actionText, tokensIn: totalIn, tokensOut: totalOut };
        }

        // Append assistant tool-call turn + tool results turn
        current = [
          ...current,
          { role: 'assistant_tool_call', toolCalls: round.toolCalls },
          { role: 'tool_result',         results: toolResults },
        ];
      }
    }

    // Max iterations reached — force final answer
    console.warn(`[AgentLoop] max iterations (${MAX_ITERATIONS}) reached, forcing final answer`);
    // Keep the tool-result message format when finalising. Calling plain
    // chat() here loses the provider-specific function-call history shape
    // (and breaks Gemini's ChatSession input contract).
    const fallback = await this.#provider.chatWithTools(
      current,
      systemPrompt + '\n\nHãy tổng hợp lại những gì bạn đã tìm được và đưa ra câu trả lời cuối cùng bằng tiếng Việt.',
      { allowedToolNames: [], requireToolCall: false },
    );
    const text     = fallback.text ?? fallback;
    const tokensIn  = totalIn  + (fallback.tokensIn  || 0);
    const tokensOut = totalOut + (fallback.tokensOut || 0);
    return { text, tokensIn, tokensOut };
  }

  #formatCompletedAction(toolResults) {
    const action = toolResults.find(({ name }) =>
      ['schedule_manage', 'company_dashboard_metrics'].includes(name)
    );
    if (!action) return null;

    const data = typeof action.content === 'string'
      ? (() => { try { return JSON.parse(action.content); } catch (_) { return null; } })()
      : action.content;
    if (!data || data.ok === false) return null;

    if (action.name === 'company_dashboard_metrics') {
      const period = data.period || 'today';
      const orderCount = data.order_count ?? data.orders ?? 0;
      const revenue = data.revenue ?? data.total_revenue ?? 0;
      const products = data.products ?? data.product_count ?? 0;
      const currency = data.currency || 'VND';
      return `📊 Dashboard công ty — ${period}\n\nĐơn hàng: ${orderCount}\nDoanh thu: ${revenue} ${currency}\nSản phẩm: ${products}`;
    }

    const schedule = data.schedule;
    switch (data.operation) {
      case 'create':
        return `✅ Đã thêm lịch #${schedule?.id}: ${schedule?.title}\n📅 ${schedule?.remindAt}`;
      case 'update':
        return data.status === 'not_found'
          ? '❌ Không tìm thấy lịch cần cập nhật.'
          : `✅ Đã cập nhật lịch #${schedule?.id || data.scheduleId}.`;
      case 'delete':
        return data.deleted
          ? `✅ Đã xóa lịch #${data.scheduleId}.`
          : `❌ Không tìm thấy lịch #${data.scheduleId}.`;
      case 'list': {
        const schedules = data.schedules || [];
        if (!schedules.length) return '📅 Hiện không có lịch phù hợp.';
        return `📅 Có ${schedules.length} lịch:\n` + schedules
          .map((item) => `#${item.id} — ${item.title} — ${item.remind_at}`)
          .join('\n');
      }
      default:
        return null;
    }
  }

  /**
   * Ask the provider for a capability, not a natural-language command.
   * This keeps routing semantic while allowing the provider adapter to
   * restrict the first tool call to the correct domain.
   */
  async #routeCapability(messages) {
    const prompt = [...messages].reverse().find((message) => message.role === 'user')?.content;
    if (!prompt) return null;

    try {
      const route = await this.#provider.chat(
        [{ role: 'user', content: prompt }],
        'Classify this request as JSON only. Choose exactly one capability: '
        + 'schedule_manage for reminders/calendar/meetings/events/tasks; '
        + 'company_dashboard_metrics for internal company Dashboard/business data/orders/revenue/products/sales; '
        + 'web_search for current public web research, search, weather, real-time facts, news, price, public information; '
        + 'memory for explicit save/recall requests; none for ordinary conversation. '
        + 'Schema: {"capability":"schedule_manage|company_dashboard_metrics|web_search|memory|none"}.'
      );
      const raw = String(route?.text ?? route ?? '').replace(/```json?|```/gi, '').trim();
      const capability = JSON.parse(raw).capability;
      const capabilities = {
        schedule_manage: ['schedule_manage'],
        company_dashboard_metrics: ['company_dashboard_metrics'],
        web_search: ['web_search', 'web_crawl', 'http_fetch', 'browser_automate'],
        memory: ['save_memory', 'recall_memory'],
        none: null,
      };
      return capabilities[capability] !== undefined ? capabilities[capability] : null;
    } catch (error) {
      console.warn('[AgentLoop] capability routing unavailable; using provider auto-routing:', error.message);
      return null;
    }
  }

  /**
   * Dispatch a tool call to the correct OpenClawService method.
   * @param {string} name
   * @param {object} args
   * @returns {Promise<any>}
   */
  async #executeTool(name, args) {
    switch (name) {
      case 'web_search':
        try {
          return await this.#openClaw.search(args.query, args.num);
        } catch (clawErr) {
          console.warn(`[AgentLoop] OpenClaw web_search failed (${clawErr.message}), using web fallback...`);
          return await this.#fallbackWebSearch(args.query);
        }
      case 'web_crawl':
        try {
          return await this.#openClaw.crawl(args.url, args.selector);
        } catch (clawErr) {
          return JSON.stringify({ ok: false, error: clawErr.message });
        }
      case 'http_fetch':
        return this.#openClaw.fetch(args.url, args.method, args.headers, args.body);
      case 'browser_automate':
        return this.#openClaw.automate(args.url, args.steps);
      case 'save_memory': {
        if (!this.#insightRepo || !this.#context)
          return JSON.stringify({ ok: false, reason: 'memory unavailable' });
        await this.#insightRepo.upsert(
          this.#context.userId, this.#context.platform, this.#context.channelId,
          args.key, args.value, args.source || undefined
        );
        return JSON.stringify({ ok: true, message: `Đã lưu: ${args.key}` });
      }
      case 'recall_memory': {
        if (!this.#insightRepo || !this.#context) return JSON.stringify([]);
        const mems = await this.#insightRepo.findByUser(this.#context.userId, this.#context.platform);
        return JSON.stringify(mems);
      }
      case 'company_dashboard_metrics':
        if (!this.#context?.authorizedOperator) {
          return JSON.stringify({
            ok: false,
            code: 'permission_denied',
            message: 'Company metrics are restricted to authorized CEO operators.',
          });
        }
        return this.#openClaw.getCompanyDashboardMetrics(args.period || 'today');
      case 'schedule_manage':
        if (!this.#scheduler) {
          return JSON.stringify({ ok: false, code: 'scheduler_unavailable' });
        }
        if (!this.#context) {
          return JSON.stringify({ ok: false, code: 'schedule_context_missing' });
        }
        console.log(`[OpenClaw] ${JSON.stringify({ event: 'schedule_dispatch', source: 'openclaw', operation: args.operation, scheduleId: args.scheduleId, userId: this.#context.userId })}`);
        return this.#scheduler.manage({
          ...args,
          source: 'openclaw',
          userId: this.#context.userId,
          username: this.#context.username,
          channelId: this.#context.channelId,
          platform: this.#context.platform,
        });
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async #fallbackWebSearch(query) {
    try {
      const clean = String(query || '').trim();
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(clean)}&format=json&no_html=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const results = [];
        if (data.AbstractText) {
          results.push({ title: data.Heading || clean, snippet: data.AbstractText, link: data.AbstractURL || '' });
        }
        for (const topic of data.RelatedTopics || []) {
          if (topic.Text) {
            results.push({ title: topic.Text.slice(0, 50), snippet: topic.Text, link: topic.FirstURL || '' });
          }
        }
        if (results.length) {
          return { results };
        }
      }
    } catch (_) {}
    return { results: [], message: `Không tìm thấy kết quả trực tuyến cho "${query}"` };
  }
}

module.exports = AgentLoop;
