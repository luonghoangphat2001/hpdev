const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.CLAUDE_KEY });

async function askClaude(messages, systemPrompt) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  return response.content[0].text;
}

module.exports = { askClaude };
