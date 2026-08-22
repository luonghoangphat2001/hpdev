'use strict';

const AIProvider = require('./AIProvider');

/**
 * Cloudflare Workers AI REST provider.
 * Uses the account-scoped /ai/run endpoint, which works with a Workers AI token
 * without requiring AI Gateway permissions.
 */
class CloudflareProvider extends AIProvider {
  #apiToken;
  #accountId;
  #modelName;
  #baseUrl;

  constructor(apiToken, accountId, modelName, baseUrl) {
    super();
    this.#apiToken = apiToken;
    this.#accountId = accountId;
    this.#modelName = modelName || '@cf/meta/llama-3.1-8b-instruct';
    this.#baseUrl = (baseUrl || `https://api.cloudflare.com/client/v4/accounts/${accountId}`).replace(/\/$/, '');
  }

  async chat(messages, systemPrompt) {
    const response = await this.#request({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
      ],
      max_tokens: 1024,
    });
    return {
      text: response.result?.response || response.result?.choices?.[0]?.message?.content || '',
      tokensIn: response.result?.usage?.prompt_tokens || 0,
      tokensOut: response.result?.usage?.completion_tokens || 0,
    };
  }

  // Workers AI direct REST is used as a text fallback. Tool execution remains
  // protected by DAN/OpenClaw and requires an AI Gateway/tool-capable route.
  async chatWithTools(agentMessages, systemPrompt) {
    const result = await this.chat(
      agentMessages.filter((message) => ['user', 'assistant'].includes(message.role)),
      systemPrompt,
    );
    return {
      type: 'text',
      text: result.text,
      toolCalls: null,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    };
  }

  async #request(input) {
    if (!this.#apiToken) throw new Error('CLOUDFLARE_API_TOKEN not configured');
    if (!this.#accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID not configured');

    const response = await fetch(`${this.#baseUrl}/ai/run/${this.#modelName}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.#apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false) {
      const detail = body.errors?.map((error) => error.message || error.code).filter(Boolean).join('; ');
      throw new Error(`Cloudflare Workers AI ${response.status}: ${detail || response.statusText}`);
    }
    return body;
  }
}

module.exports = CloudflareProvider;
