require("dotenv").config();
const Discord = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new Discord.Client();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_KEY = process.env.GEMINI_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash"
});

client.on("ready", () => {
  console.log("Bot online");
});

client.on("message", async (msg) => {
  if (msg.author.bot) return;

  if (msg.content.startsWith("!ai")) {
    const question = msg.content.replace("!ai", "").trim();

    try {
      const result = await model.generateContent(question);
      const response = result.response.text();

      msg.reply(response);
    } catch (err) {
      console.log(err);
      msg.reply("AI error");
    }
  }
});

client.login(DISCORD_TOKEN);