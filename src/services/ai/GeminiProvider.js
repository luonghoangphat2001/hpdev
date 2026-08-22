'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIProvider = require('./AIProvider');

/**
 * Gemini AI provider with automatic 429-quota fallback.
 */
class GeminiProvider extends AIProvider {
  /** @type {GoogleGenerativeAI} */
  #client;
  /** @type {string} */
  #modelName;

  static #FALLBACK_MODEL = 'gemini-flash-latest';

  /**
   * @param {string} apiKey
   * @param {string} modelName
   */
  constructor(apiKey, modelName) {
    super();
    this.#client = new GoogleGenerativeAI(apiKey);
    this.#modelName = modelName || GeminiProvider.#FALLBACK_MODEL;
  }

  async chat(messages, systemPrompt) {
    try {
      return await this.#callGemini(this.#modelName, messages, systemPrompt);
    } catch (err) {
      if ((err.status === 429 || err.status === 404) && this.#modelName !== GeminiProvider.#FALLBACK_MODEL) {
        console.warn(`[Gemini] ${err.status} on ${this.#modelName}, falling back to ${GeminiProvider.#FALLBACK_MODEL}`);
        return await this.#callGemini(GeminiProvider.#FALLBACK_MODEL, messages, systemPrompt);
      }
      throw err;
    }
  }

  /**
   * Agent-mode chat with function calling.
   * Uses generateContent (not startChat) to support full history replay.
   * @param {Array<object>} agentMessages
   * @param {string} systemPrompt
   */
  async chatWithTools(agentMessages, systemPrompt, options = {}) {
    try {
      return await this.#callGeminiWithTools(this.#modelName, agentMessages, systemPrompt, options);
    } catch (err) {
      if ((err.status === 429 || err.status === 404) && this.#modelName !== GeminiProvider.#FALLBACK_MODEL) {
        console.warn(`[Gemini] ${err.status} on ${this.#modelName}, falling back to ${GeminiProvider.#FALLBACK_MODEL}`);
        return await this.#callGeminiWithTools(GeminiProvider.#FALLBACK_MODEL, agentMessages, systemPrompt, options);
      }
      throw err;
    }
  }

  /**
   * @param {string} modelName
   * @param {Array<object>} agentMessages
   * @param {string} systemPrompt
   */
  async #callGeminiWithTools(modelName, agentMessages, systemPrompt, options = {}) {
    const ToolRegistry = require('../ToolRegistry');
    const allowed = options.allowedToolNames;
    const restricted = Array.isArray(allowed);
    const toolDefs = ToolRegistry.forGemini().filter((tool) => !restricted || allowed.includes(tool.name));

    const model = this.#client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      ...(toolDefs.length ? { tools: [{ functionDeclarations: toolDefs }] } : {}),
      ...(options.requireToolCall && toolDefs.length ? {
        toolConfig: {
          functionCallingConfig: {
            mode: 'ANY',
            allowedFunctionNames: toolDefs.map((tool) => tool.name),
          },
        },
      } : {}),
    });

    // Convert standard agent messages to Gemini's content format
    const contents = [];
    for (const msg of agentMessages) {
      if (msg.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'assistant') {
        contents.push({ role: 'model', parts: [{ text: msg.content }] });
      } else if (msg.role === 'assistant_tool_call') {
        contents.push({
          role: 'model',
          parts: msg.toolCalls.map((tc) => ({
            functionCall: { name: tc.name, args: tc.args },
            ...(tc.thoughtSignature ? { thoughtSignature: tc.thoughtSignature } : {}),
          })),
        });
      } else if (msg.role === 'tool_result') {
        contents.push({
          role: 'user',
          parts: msg.results.map((r) => ({
            functionResponse: {
              name: r.name,
              response: typeof r.content === 'string'
                ? { content: r.content }
                : (r.content || {}),
            },
          })),
        });
      }
    }

    // Gemini requires history to start with 'user'
    while (contents.length > 0 && contents[0].role !== 'user') contents.shift();
    // Safety: if all messages were stripped, re-add the last user message
    if (contents.length === 0) {
      const lastUser = agentMessages.filter((m) => m.role === 'user').slice(-1)[0];
      if (lastUser) contents.push({ role: 'user', parts: [{ text: lastUser.content }] });
    }

    if (!contents.length) {
      throw new Error('Gemini tool request has no valid content messages');
    }
    // This SDK version expects the GenerateContentRequest wrapper. Passing
    // the array directly makes it interpret each Content object as a Part.
    const result = await model.generateContent({ contents });
    const usage  = result.response.usageMetadata || {};
    const tokensIn  = usage.promptTokenCount     || 0;
    const tokensOut = usage.candidatesTokenCount || 0;

    // Check for function calls in the response
    const parts   = result.response.candidates?.[0]?.content?.parts || [];
    const fnCalls = parts.filter((p) => p.functionCall);

    if (fnCalls.length > 0) {
      return {
        type: 'tool_calls',
        text: null,
        toolCalls: fnCalls.map((p, i) => ({
          id:   `${p.functionCall.name}_${Date.now()}_${i}`,
          name: p.functionCall.name,
          args: p.functionCall.args || {},
          thoughtSignature: p.thoughtSignature || p.thought_signature || null,
        })),
        tokensIn,
        tokensOut,
      };
    }

    return {
      type: 'text',
      text: result.response.text(),
      toolCalls: null,
      tokensIn,
      tokensOut,
    };
  }

  /**
   * @param {string} modelName
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} systemPrompt
   */
  async #callGemini(modelName, messages, systemPrompt) {
    const model = this.#client.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    // Gemini requires history to start with 'user' — drop leading model messages
    while (history.length > 0 && history[0].role !== 'user') history.shift();

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const usage = result.response.usageMetadata || {};
    return {
      text: result.response.text(),
      tokensIn:  usage.promptTokenCount     || 0,
      tokensOut: usage.candidatesTokenCount || 0,
    };
  }
}

module.exports = GeminiProvider;
