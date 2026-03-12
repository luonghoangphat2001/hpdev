const { Telegraf } = require("telegraf");
const { askGemini } = require("../ai/gemini");
const { askClaude } = require("../ai/claude");
const { getConfig, saveMessage, getHistory } = require("../db");

async function handleAI(ctx, prompt) {
  const channelId = String(ctx.chat.id);
  const userId = String(ctx.from.id);
  const username = ctx.from.username || ctx.from.first_name || "user";

  const activeModel = getConfig("active_model") || "gemini";
  const systemPrompt = getConfig("system_prompt") || "You are a helpful assistant.";

  const history = await getHistory(channelId, 10);
  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: prompt },
  ];

  const thinking = await ctx.reply("⏳ Đang xử lý...");

  try {
    const response =
      activeModel === "claude"
        ? await askClaude(messages, systemPrompt)
        : await askGemini(messages, systemPrompt);

    await saveMessage({ channelId, userId, username, role: "user", content: prompt, model: activeModel });
    await saveMessage({ channelId, userId: "bot", username: "Bot", role: "assistant", content: response, model: activeModel });

    await ctx.telegram.deleteMessage(ctx.chat.id, thinking.message_id);
    await ctx.reply(response);
  } catch (err) {
    console.error("Telegram AI error:", err);
    await ctx.telegram.deleteMessage(ctx.chat.id, thinking.message_id);
    await ctx.reply("❌ Lỗi: " + err.message);
  }
}

function startTelegram() {
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    console.log("TELEGRAM_TOKEN not set, skipping Telegram bot");
    return;
  }

  const bot = new Telegraf(token);

  bot.start((ctx) => {
    ctx.reply("Ê đần đây! Gọi tao bằng /ai <câu hỏi> hoặc cứ nhắc tới 'đần' là tao trả lời 😤");
  });

  // /ai command
  bot.command("ai", async (ctx) => {
    const prompt = ctx.message.text.replace(/^\/ai\s*/i, "").trim();
    if (!prompt) return ctx.reply("Hỏi gì đi đần ơi 😑");
    await handleAI(ctx, prompt);
  });

  // Nghe bất kỳ tin nhắn nào có chữ "đần"
  bot.hears(/đần/i, async (ctx) => {
    const text = ctx.message.text.trim();
    // Bỏ các từ gọi tên như "ê đần", "này đần", "đần ơi"... lấy phần câu hỏi
    const prompt = text
      .replace(/^(ê|này|hey|oi|ơi|à)?\s*đần\s*(ơi|oi|à|ê|hey)?\s*/i, "")
      .trim();

    if (!prompt) return ctx.reply("Gọi tao hả? Hỏi gì đi 😤");
    await handleAI(ctx, prompt);
  });

  bot.launch();
  console.log("Telegram bot online");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

module.exports = { startTelegram };
