/**
 * Run ONCE to register slash commands with Discord:
 *   node scripts/register.js
 *
 * Global commands take up to 1 hour to propagate.
 * Set DISCORD_GUILD_ID in .env for instant guild-only registration (recommended for testing).
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Chat with AI (Claude or Gemini)")
    .addStringOption((opt) =>
      opt.setName("prompt").setDescription("Your question").setRequired(true)
    ),
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

const route = process.env.DISCORD_GUILD_ID
  ? Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID)
  : Routes.applicationCommands(process.env.DISCORD_CLIENT_ID);

rest
  .put(route, { body: commands.map((c) => c.toJSON()) })
  .then(() => {
    const scope = process.env.DISCORD_GUILD_ID ? "guild" : "global";
    console.log(`✅ Slash commands registered (${scope})`);
  })
  .catch(console.error);
