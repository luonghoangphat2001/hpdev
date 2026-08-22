'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const AIProvider = require('./AIProvider');

/**
 * Anthropic Claude provider.
 * Supports an optional proxy base URL for custom endpoints.
 */
class ClaudeProvider extends AIProvider {
  /** @type {Anthropic} */
  #client;
  /** @type {string} */
  #modelName;

  /**
   * @param {string} apiKey
   * @param {string} modelName
   * @param {string} [baseURL]  optional proxy endpoint
   */
  constructor(apiKey, modelName, baseURL) {
    super();
    this.#client = new Anthropic({ apiKey, baseURL: baseURL || undefined });
    this.#modelName = modelName || 'claude-sonnet-4-6';
  }

  async chat(messages, systemPrompt) {
    const response = await this.#client.messages.create({
      model: this.#modelName,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return {
      text:      response.content[0].text,
      tokensIn:  response.usage?.input_tokens  || 0,
      tokensOut: response.usage?.output_tokens || 0,
    };
  }

  /**
   * Agent-mode chat with tool use.
   * @param {Array<object>} agentMessages
   * @param {string} systemPrompt
   */
  async chatWithTools(agentMessages, systemPrompt, options = {}) {
    const ToolRegistry  = require('../ToolRegistry');
    const allowed = options.allowedToolNames;
    const restricted = Array.isArray(allowed);
    const claudeTools   = ToolRegistry.forClaude().filter((tool) => !restricted || allowed.includes(tool.name));

    // Convert standard agent messages to Claude format
    const claudeMessages = [];
    for (const msg of agentMessages) {
      if (msg.role === 'user') {
        claudeMessages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        claudeMessages.push({ role: 'assistant', content: msg.content });
      } else if (msg.role === 'assistant_tool_call') {
        claudeMessages.push({
          role: 'assistant',
          content: msg.toolCalls.map((tc) => ({
            type:  'tool_use',
            id:    tc.id,
            name:  tc.name,
            input: tc.args,
          })),
        });
      } else if (msg.role === 'tool_result') {
        claudeMessages.push({
          role: 'user',
          content: msg.results.map((r) => ({
            type:        'tool_result',
            tool_use_id: r.id,
            content:     typeof r.content === 'string' ? r.content : JSON.stringify(r.content),
          })),
        });
      }
    }

    const response = await this.#client.messages.create({
      model:      this.#modelName,
      max_tokens: 4096,
      system:     systemPrompt,
      messages:   claudeMessages,
      ...(claudeTools.length > 0 ? { tools: claudeTools } : {}),
      ...(options.requireToolCall && claudeTools.length ? { tool_choice: { type: 'any' } } : {}),
    });

    const tokensIn  = response.usage?.input_tokens  || 0;
    const tokensOut = response.usage?.output_tokens || 0;

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
      return {
        type: 'tool_calls',
        text: null,
        toolCalls: toolUseBlocks.map((b) => ({
          id:   b.id,
          name: b.name,
          args: b.input,
        })),
        tokensIn,
        tokensOut,
      };
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    return {
      type: 'text',
      text: textBlock?.text || '',
      toolCalls: null,
      tokensIn,
      tokensOut,
    };
  }
}

module.exports = ClaudeProvider;
