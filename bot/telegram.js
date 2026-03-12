const { Telegraf } = require("telegraf");
const { askGemini } = require("../ai/gemini");
const { askClaude } = require("../ai/claude");
const { getConfig, saveMessage, getHistory } = require("../db");

function startTelegram() {
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    console.log("TELEGRAM_TOKEN not set, skipping Telegram bot");
    return;
  }

  const bot = new Telegraf(token);

  // /start command
  bot.start((ctx) => {
    ctx.reply("Xin chào! Gõ /ai <câu hỏi> để chat với AI.");
  });

  // /ai command
  bot.command("ai", async (ctx) => {
    const prompt = ctx.message.text.replace(/^\/ai\s*/i, "").trim();
    if (!prompt) return ctx.reply("Vui lòng nhập câu hỏi. Ví dụ: /ai Hôm nay thời tiết thế nào?");

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

    // Gửi "đang xử lý..."
    const thinking = await ctx.reply("⏳ Đang xử lý...");

    try {
      const response =
        activeModel === "claude"
          ? await askClaude(messages, systemPrompt)
          : await askGemini(messages, systemPrompt);

      await saveMessage({ channelId, userId, username, role: "user", content: prompt, model: activeModel });
      await saveMessage({ channelId, userId: "bot", username: "Bot", role: "assistant", content: response, model: activeModel });

      // Xóa "đang xử lý" và gửi kết quả
      await ctx.telegram.deleteMessage(ctx.chat.id, thinking.message_id);
      await ctx.reply(response);
    } catch (err) {
      console.error("Telegram AI error:", err);
      await ctx.telegram.deleteMessage(ctx.chat.id, thinking.message_id);
      await ctx.reply("❌ Lỗi: " + err.message);
    }
  });

  bot.launch();
  console.log("Telegram bot online");

  // Graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

module.exports = { startTelegram };
