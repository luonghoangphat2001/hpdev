const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getConfig } = require("../db");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function callGemini(modelName, messages, systemPrompt) {
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

async function askGemini(messages, systemPrompt) {
  const modelName = getConfig("gemini_model") || "models/gemini-1.5-flash";

  try {
    return await callGemini(modelName, messages, systemPrompt);
  } catch (err) {
    // Fallback to gemini-1.5-flash if quota exceeded on primary model
    if (err.status === 429 && modelName !== "models/gemini-1.5-flash") {
      console.warn(`[Gemini] 429 on ${modelName}, falling back to gemini-1.5-flash`);
      return await callGemini("models/gemini-1.5-flash", messages, systemPrompt);
    }
    throw err;
  }
}

module.exports = { askGemini };
