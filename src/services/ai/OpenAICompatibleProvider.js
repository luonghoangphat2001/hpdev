'use strict';

const OpenAI = require('openai');
const AIProvider = require('./AIProvider');

/**
 * OpenAI-compatible provider wrapper.
 * Supports OpenAI, Ollama, vLLM, and other OpenAI-compatible endpoints.
 */
class OpenAICompatibleProvider extends AIProvider {
  /** @type {OpenAI} */
  #client;
  /** @type {string} */
  #modelName;
  /** @type {string} */
  #providerLabel;

  /**
   * @param {string} apiKey
   * @param {string} modelName
   * @param {string} [baseURL]
   * @param {string} [providerLabel]
   * @param {Record<string, string>} [defaultHeaders]
   */
  constructor(apiKey, modelName, baseURL, providerLabel = 'OpenAI-compatible', defaultHeaders = {}) {
    super();
    this.#client = new OpenAI({ apiKey, baseURL: baseURL || undefined, defaultHeaders });
    this.#modelName = modelName || 'gpt-4o';
    this.#providerLabel = providerLabel;
  }

  async chat(messages, systemPrompt) {
    const response = await this.#client.chat.completions.create({
      model: this.#modelName,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
    return {
      text:      response.choices[0].message.content,
      tokensIn:  response.usage?.prompt_tokens     || 0,
      tokensOut: response.usage?.completion_tokens || 0,
    };
  }

  /**
   * Agent-mode chat with function calling.
   * @param {Array<object>} agentMessages
   * @param {string} systemPrompt
   */
  async chatWithTools(agentMessages, systemPrompt, options = {}) {
    const ToolRegistry = require('../ToolRegistry');
    const allowed = options.allowedToolNames;
    const restricted = Array.isArray(allowed);
    const openaiTools  = ToolRegistry.forChatGPT().filter((tool) => !restricted || allowed.includes(tool.function.name));

    const openaiMessages = [{ role: 'system', content: systemPrompt }];
    for (const msg of agentMessages) {
      if (msg.role === 'user') {
        openaiMessages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        openaiMessages.push({ role: 'assistant', content: msg.content });
      } else if (msg.role === 'assistant_tool_call') {
        openaiMessages.push({
          role:       'assistant',
          content:    null,
          tool_calls: msg.toolCalls.map((tc) => ({
            id:       tc.id,
            type:     'function',
            function: {
              name:      tc.name,
              arguments: JSON.stringify(tc.args),
            },
          })),
        });
      } else if (msg.role === 'tool_result') {
        for (const r of msg.results) {
          openaiMessages.push({
            role:         'tool',
            tool_call_id: r.id,
            content:      typeof r.content === 'string' ? r.content : JSON.stringify(r.content),
          });
        }
      }
    }

    const response = await this.#client.chat.completions.create({
      model:       this.#modelName,
      max_tokens:  4096,
      messages:    openaiMessages,
      ...(openaiTools.length > 0 ? { tools: openaiTools } : {}),
      ...(openaiTools.length > 0 && options.requireToolCall ? { tool_choice: 'required' } : {}),
    });

    const tokensIn  = response.usage?.prompt_tokens     || 0;
    const tokensOut = response.usage?.completion_tokens || 0;
    const message   = response.choices[0].message;

    if (response.choices[0].finish_reason === 'tool_calls' && message.tool_calls?.length > 0) {
      return {
        type: 'tool_calls',
        text: null,
        toolCalls: message.tool_calls.map((tc) => {
          let args = {};
          try { args = JSON.parse(tc.function.arguments); } catch (_) {}
          return { id: tc.id, name: tc.function.name, args };
        }),
        tokensIn,
        tokensOut,
      };
    }

    return {
      type: 'text',
      text: message.content,
      toolCalls: null,
      tokensIn,
      tokensOut,
    };
  }
}

module.exports = OpenAICompatibleProvider;
