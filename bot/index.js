const { Client, GatewayIntentBits } = require("discord.js");
const { askGemini } = require("../ai/gemini");
const { askClaude } = require("../ai/claude");
const { getConfig, saveMessage, getHistory } = require("../db");

async function handleAI({ channelId, userId, username, prompt, reply }) {
  const activeModel = getConfig("active_model") || "gemini";
  const systemPrompt = getConfig("system_prompt") || "You are a helpful assistant.";

  const history = await getHistory(channelId, 10);
  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: prompt },
  ];

  const response =
    activeModel === "claude"
      ? await askClaude(messages, systemPrompt)
      : await askGemini(messages, systemPrompt);

  await saveMessage({ channelId, userId, username, role: "user", content: prompt, model: activeModel });
  await saveMessage({ channelId, userId: "bot", username: "Bot", role: "assistant", content: response, model: activeModel });

  return response.length > 2000 ? response.substring(0, 1997) + "..." : response;
}

function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.on("clientReady", () => {
    console.log(`Bot online: ${client.user.tag}`);
  });

  // Slash command /ai
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== "ai") return;

    await interaction.deferReply();

    try {
      const response = await handleAI({
        channelId: interaction.channelId,
        userId: interaction.user.id,
        username: interaction.user.username,
        prompt: interaction.options.getString("prompt"),
      });
      await interaction.editReply(response);
    } catch (err) {
      console.error(err);
      await interaction.editReply(`❌ Error: ${err.message}`);
    }
  });

  // Nghe tin nhắn có chữ "đần"
  client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (!/đần/i.test(msg.content)) return;

    const prompt = msg.content
      .replace(/^(ê|này|hey|oi|ơi|à)?\s*đần\s*(ơi|oi|à|ê|hey)?\s*/i, "")
      .trim();

    if (!prompt) return msg.reply("Gọi tao hả? Hỏi gì đi 😤");

    const typing = await msg.channel.sendTyping();

    try {
      const response = await handleAI({
        channelId: msg.channelId,
        userId: msg.author.id,
        username: msg.author.username,
        prompt,
      });
      await msg.reply(response);
    } catch (err) {
      console.error(err);
      await msg.reply(`❌ Error: ${err.message}`);
    }
  });

  client.login(process.env.DISCORD_TOKEN);
}

module.exports = { startBot };
