const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { askGemini } = require("../ai/gemini");
const { askClaude } = require("../ai/claude");
const { getConfig, saveMessage, getHistory } = require("../db");

const commands = [
  new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Chat with AI (Claude or Gemini)")
    .addStringOption((opt) =>
      opt.setName("prompt").setDescription("Your question").setRequired(true)
    ),
];

async function registerCommands() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
    body: commands.map((c) => c.toJSON()),
  });
  console.log("Slash commands registered");
}

function startBot() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on("ready", async () => {
    console.log(`Bot online: ${client.user.tag}`);
    await registerCommands();
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== "ai") return;

    await interaction.deferReply();

    const prompt = interaction.options.getString("prompt");
    const channelId = interaction.channelId;
    const userId = interaction.user.id;
    const username = interaction.user.username;

    const activeModel = getConfig("active_model") || "gemini";
    const systemPrompt = getConfig("system_prompt") || "You are a helpful assistant.";

    const history = getHistory(channelId, 10);
    const messages = [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: prompt },
    ];

    try {
      const response =
        activeModel === "claude"
          ? await askClaude(messages, systemPrompt)
          : await askGemini(messages, systemPrompt);

      saveMessage({ channelId, userId, username, role: "user", content: prompt, model: activeModel });
      saveMessage({ channelId, userId: "bot", username: "Bot", role: "assistant", content: response, model: activeModel });

      const reply = response.length > 2000 ? response.substring(0, 1997) + "..." : response;
      await interaction.editReply(reply);
    } catch (err) {
      console.error(err);
      await interaction.editReply(`❌ Error: ${err.message}`);
    }
  });

  client.login(process.env.DISCORD_TOKEN);
}

module.exports = { startBot };
