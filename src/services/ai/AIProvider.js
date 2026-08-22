'use strict';

/**
 * Abstract base class for AI providers (Strategy Pattern).
 * Each concrete provider encapsulates one AI SDK.
 */
class AIProvider {
  /**
   * Standard chat (no tools).
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} systemPrompt
   * @returns {Promise<{ text: string, tokensIn: number, tokensOut: number }>}
   */
  // eslint-disable-next-line no-unused-vars
  async chat(messages, systemPrompt) {
    throw new Error(`${this.constructor.name} must implement chat()`);
  }

  /**
   * Agent-mode chat with OpenClaw tool calling.
   * Accepts messages in AgentLoop's standard format (including assistant_tool_call
   * and tool_result roles) and returns either a text response or tool calls.
   *
   * @param {Array<object>} agentMessages  Standard agent message history.
   * @param {string} systemPrompt
   * @returns {Promise<{
   *   type: 'text'|'tool_calls',
   *   text: string|null,
   *   toolCalls: Array<{id: string, name: string, args: object}>|null,
   *   tokensIn: number,
   *   tokensOut: number,
   * }>}
   */
  // eslint-disable-next-line no-unused-vars
  async chatWithTools(agentMessages, systemPrompt) {
    throw new Error(`${this.constructor.name} must implement chatWithTools()`);
  }
}

module.exports = AIProvider;
