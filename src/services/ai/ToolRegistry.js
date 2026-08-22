'use strict';

/**
 * Static tool definitions for OpenClaw endpoints in each AI provider's native format.
 * Tools: web_search, web_crawl, http_fetch, browser_automate
 */
class ToolRegistry {
  /** Shared parameter definitions — one source of truth */
  static #PARAMS = {
    web_search: {
      description: 'Tìm kiếm thông tin trên Google. Dùng khi cần thông tin mới nhất, sự kiện thực tế, tin tức, giá cả, hoặc bất kỳ câu hỏi nào cần dữ liệu web hiện tại.',
      properties: {
        query: { type: 'string', description: 'Từ khóa tìm kiếm bằng tiếng Việt hoặc tiếng Anh' },
        num:   { type: 'number', description: 'Số kết quả cần lấy (1-50, mặc định 5)' },
      },
      required: ['query'],
    },
    web_crawl: {
      description: 'Đọc toàn bộ nội dung một trang web bằng trình duyệt headless. Dùng khi có URL cụ thể cần đọc nội dung chi tiết.',
      properties: {
        url:      { type: 'string', description: 'URL đầy đủ của trang web cần đọc (https://...)' },
        selector: { type: 'string', description: 'CSS selector để lấy phần nội dung cụ thể (tuỳ chọn, để trống để lấy toàn trang)' },
      },
      required: ['url'],
    },
    http_fetch: {
      description: 'Gửi HTTP request đến một URL (proxy). Dùng cho REST API endpoints, download JSON, hoặc trang web đơn giản không cần JavaScript.',
      properties: {
        url:     { type: 'string',  description: 'URL cần gửi request (https://...)' },
        method:  { type: 'string',  description: 'HTTP method: GET, POST, PUT, DELETE (mặc định GET)' },
        headers: { type: 'object',  description: 'HTTP headers dạng object key-value (tuỳ chọn)' },
        body:    { type: 'string',  description: 'Request body cho POST/PUT dạng JSON string (tuỳ chọn)' },
      },
      required: ['url'],
    },
    browser_automate: {
      description: 'Tự động hoá trình duyệt: click, điền form, chụp màn hình. Dùng cho trang web tương tác cần thao tác như đăng nhập, điền form.',
      properties: {
        url:   { type: 'string', description: 'URL trang web cần tự động hoá (https://...)' },
        steps: {
          type: 'array',
          description: 'Danh sách bước thực hiện theo thứ tự. Mỗi bước là object: { action: "click"|"fill"|"screenshot"|"wait", selector: "CSS selector", value: "giá trị điền (nếu fill)" }',
          items: {
            type: 'object',
            properties: {
              action:   { type: 'string', description: 'Hành động: click, fill, screenshot hoặc wait' },
              selector: { type: 'string', description: 'CSS selector của phần tử' },
              value:    { type: 'string', description: 'Giá trị dùng cho hành động fill' },
            },
            required: ['action'],
          },
        },
      },
      required: ['url', 'steps'],
    },
    save_memory: {
      description: 'Lưu thông tin quan trọng về user vào bộ nhớ dài hạn để dùng ở các cuộc trò chuyện sau. Gọi khi user chia sẻ sở thích, lĩnh vực nghiên cứu, hoặc thông tin cá nhân hữu ích.',
      properties: {
        key:    { type: 'string', description: 'Tên nhãn ngắn gọn (vd: "interest", "studying", "preferred_language")' },
        value:  { type: 'string', description: 'Nội dung cần lưu' },
        source: { type: 'string', description: 'Nguồn thông tin — URL hoặc mô tả (tuỳ chọn)' },
      },
      required: ['key', 'value'],
    },
    recall_memory: {
      description: 'Xem lại tất cả thông tin đã lưu về user. Gọi khi cần biết sở thích hoặc lĩnh vực nghiên cứu của user để cá nhân hóa câu trả lời.',
      properties: {},
      required: [],
    },
    company_dashboard_metrics: {
      description: 'Read company internal business metrics through OpenClaw SSOT. Use this for any natural-language request about the company Dashboard, products, orders, revenue, sales, inventory, agents, or internal operational statistics. Never ask the user for a URL or credentials. Select the reporting period from the user request: today, month, quarter, or year.',
      properties: {
        period: {
          type: 'string',
          description: 'Reporting period: today, month, quarter, or year. Default today.',
          enum: ['today', 'month', 'quarter', 'year'],
        },
      },
      required: [],
    },
    schedule_manage: {
      description: 'Manage the authenticated user schedule through the scheduler service. Use for any request to create, list, inspect, update, reschedule, or delete reminders, meetings, classes, work tasks, or events. Infer operation and structured fields from any language; do not ask the user to use a fixed command format. For create/update, convert the requested local date and time into YYYY-MM-DD HH:MM:SS. For list, optionally provide date YYYY-MM-DD. For update/delete, provide scheduleId when known.',
      properties: {
        operation: {
          type: 'string',
          description: 'Operation: create, list, update, or delete.',
          enum: ['create', 'list', 'update', 'delete'],
        },
        scheduleId: { type: 'number', description: 'Existing schedule ID for update/delete.' },
        title: { type: 'string', description: 'Reminder title or event name.' },
        remindAt: { type: 'string', description: 'Local datetime YYYY-MM-DD HH:MM:SS.' },
        repeatType: { type: 'string', description: 'Repeat rule: none, daily, or weekly.' },
        date: { type: 'string', description: 'Filter date YYYY-MM-DD for list.' },
      },
      required: ['operation'],
    },
  };

  /**
   * Tool definitions for Gemini (functionDeclarations format).
   * @returns {Array<{name: string, description: string, parameters: object}>}
   */
  static forGemini() {
    return Object.entries(ToolRegistry.#PARAMS).map(([name, spec]) => ({
      name,
      description: spec.description,
      parameters: {
        type: 'OBJECT',
        properties: Object.fromEntries(
          Object.entries(spec.properties).map(([k, v]) => [k, {
            type:        v.type === 'array' ? 'ARRAY' : v.type === 'object' ? 'OBJECT' : 'STRING',
            description: v.description,
            ...(v.type === 'array' ? {
              items: {
                type: v.items?.type === 'object' ? 'OBJECT' : 'STRING',
                ...(v.items?.properties ? {
                  properties: Object.fromEntries(
                    Object.entries(v.items.properties).map(([itemKey, item]) => [itemKey, {
                      type: item.type === 'object' ? 'OBJECT' : item.type === 'array' ? 'ARRAY' : 'STRING',
                      description: item.description,
                    }])
                  ),
                  required: v.items.required || [],
                } : {}),
              },
            } : {}),
          }])
        ),
        required: spec.required,
      },
    }));
  }

  /**
   * Tool definitions for Claude (tools format).
   * @returns {Array<{name: string, description: string, input_schema: object}>}
   */
  static forClaude() {
    return Object.entries(ToolRegistry.#PARAMS).map(([name, spec]) => ({
      name,
      description: spec.description,
      input_schema: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(spec.properties).map(([k, v]) => [k, {
            type:        v.type,
            description: v.description,
          }])
        ),
        required: spec.required,
      },
    }));
  }

  /**
   * Tool definitions for ChatGPT (tools format with type: "function").
   * @returns {Array<{type: "function", function: object}>}
   */
  static forChatGPT() {
    return Object.entries(ToolRegistry.#PARAMS).map(([name, spec]) => ({
      type: 'function',
      function: {
        name,
        description: spec.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            Object.entries(spec.properties).map(([k, v]) => [k, {
              type:        v.type,
              description: v.description,
            }])
          ),
          required: spec.required,
        },
      },
    }));
  }
}

module.exports = ToolRegistry;
