/**
 * Run ONCE to register slash commands with Discord:
 *   node scripts/register.js
 *
 * Global commands take up to 1 hour to propagate.
 * Set DISCORD_GUILD_ID in .env for instant guild-only registration (recommended for testing).
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const { ChannelType } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Chat with AI (Claude or Gemini)")
    .addStringOption((opt) =>
      opt.setName("prompt").setDescription("Your question").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("myschedule")
    .setDescription("Xem danh sách lịch nhắc của bạn"),

  new SlashCommandBuilder()
    .setName("delschedule")
    .setDescription("Xóa một lịch nhắc")
    .addIntegerOption((opt) =>
      opt.setName("id").setDescription("ID của lịch cần xóa").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setchannelschedule")
    .setDescription("Đặt channel nhận thông báo lịch (admin only)")
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Channel Discord nhận thông báo")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("approval")
    .setDescription("CEO duyệt hoặc từ chối tác vụ OpenClaw")
    .addStringOption((opt) =>
      opt.setName("approval_id").setDescription("Mã approval").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("decision").setDescription("Quyết định").setRequired(true)
        .addChoices(
          { name: "Duyệt", value: "approve" },
          { name: "Từ chối", value: "reject" }
        )
    )
    .addIntegerOption((opt) =>
      opt.setName("version").setDescription("Phiên bản quyết định").setMinValue(1).setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Lý do (khuyến nghị khi từ chối)")
    ),

  new SlashCommandBuilder()
    .setName("ceo")
    .setDescription("Điều khiển OpenClaw bằng command dành riêng cho CEO")
    .addStringOption((opt) =>
      opt.setName("command").setDescription("Command cần thực hiện").setRequired(true)
        .addChoices(
          { name: "Tạo mục tiêu", value: "goal.create" },
          { name: "Đổi ưu tiên", value: "portfolio.priority.change" },
          { name: "Tạm dừng workflow", value: "workflow.pause" },
          { name: "Tiếp tục workflow", value: "workflow.resume" },
          { name: "Duyệt", value: "approval.approve" },
          { name: "Từ chối", value: "approval.reject" },
          { name: "Yêu cầu phân tích", value: "analysis.request" }
        )
    )
    .addStringOption((opt) =>
      opt.setName("payload").setDescription("Thông tin command ở dạng JSON").setRequired(true)
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
