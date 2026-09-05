'use strict';

const AIProvider = require('@services/ai/AIProvider');

/**
 * Cloudflare Workers AI REST provider.
 * Uses the account-scoped /ai/run endpoint without raw fetch duplication.
 * Zero || operators.
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
    if (!modelName) {
      throw new Error('[CloudflareProvider] modelName is required');
    }
    this.#modelName = modelName;

    if (!baseUrl) {
      throw new Error('[CloudflareProvider] baseUrl is required (configure CLOUDFLARE_BASE_URL in environment)');
    }
    this.#baseUrl = baseUrl.replace(/\/$/, '');
  }

  async chat(messages, systemPrompt, options = {}) {
    const maxTokens = options.max_tokens ? options.max_tokens : 4096;
    const temperature = options.temperature !== undefined ? options.temperature : 0.1;
    const response = await this.#request({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
      ],
      max_tokens: maxTokens,
      temperature,
    });
    let text = '';
    const result = response.result;
    if (result) {
      if (result.response) {
        text = result.response;
      } else if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        text = result.choices[0].message.content;
      }
    }
    return {
      text,
      tokensIn: response.result?.usage?.prompt_tokens ? response.result.usage.prompt_tokens : 0,
      tokensOut: response.result?.usage?.completion_tokens ? response.result.usage.completion_tokens : 0,
    };
  }

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
    if (!this.#apiToken) throw new Error('[CloudflareProvider] CLOUDFLARE_API_TOKEN not configured');
    if (!this.#accountId) throw new Error('[CloudflareProvider] CLOUDFLARE_ACCOUNT_ID not configured');

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
      let detail = '';
      if (body.errors && Array.isArray(body.errors)) {
        detail = body.errors.map((error) => (error.message ? error.message : error.code)).filter(Boolean).join('; ');
      }
      if (!detail) {
        detail = response.statusText ? response.statusText : 'Unknown error';
      }
      throw new Error(`[CloudflareProvider] API error ${response.status}: ${detail}`);
    }
    return body;
  }
}

module.exports = CloudflareProvider;
