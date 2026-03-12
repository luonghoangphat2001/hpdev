const Anthropic = require("@anthropic-ai/sdk");
const { getConfig } = require("../db");

function getClient() {
  const baseURL = getConfig("claude_base_url") || process.env.CLAUDE_BASE_URL || undefined;
  return new Anthropic({ apiKey: process.env.CLAUDE_KEY, baseURL });
}

async function askClaude(messages, systemPrompt) {
  const model = getConfig("claude_model") || "claude-sonnet-4-6";

  const response = await getClient().messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  return response.content[0].text;
}

module.exports = { askClaude };
