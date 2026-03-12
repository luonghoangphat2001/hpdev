const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getConfig } = require("../db");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function askGemini(messages, systemPrompt) {
  const modelName = getConfig("gemini_model") || "models/gemini-2.5-flash";

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(messages[messages.length - 1].content);
  return result.response.text();
}

module.exports = { askGemini };
