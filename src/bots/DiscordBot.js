'use strict';

const { Client, GatewayIntentBits } = require('discord.js');
const BaseBot = require('./BaseBot');

/**
 * Discord bot.
 * Handles slash commands and natural-language "đần" triggers.
 */
class DiscordBot extends BaseBot {
  /** @type {Client} */
  #client;

  /** @param {import('../services/AIService')} aiService */
  constructor(aiService) {
    super(aiService, 'discord');

    this.#client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.#registerHandlers();
  }

  #registerHandlers() {
    this.#client.on('ready', () => {
      console.log(`Discord bot online: ${this.#client.user.tag}`);
    });
    this.#client.on('interactionCreate', (i)   => this.#handleInteraction(i));
    this.#client.on('messageCreate',     (msg) => this.#handleMessage(msg));
  }

  /** Handle /ai slash command */
  async #handleInteraction(interaction) {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'ai') return;

    await interaction.deferReply();
    try {
      const text = await this._aiService.chat({
        channelId: interaction.channelId,
        userId:    interaction.user.id,
        username:  interaction.user.username,
        prompt:    interaction.options.getString('prompt'),
        platform:  this._platform,
      });
      await interaction.editReply(this.#truncate(text));
    } catch (err) {
      console.error('[Discord] Interaction error:', err);
      await interaction.editReply(`❌ Error: ${err.message}`);
    }
  }

  /** Handle plain messages that mention "đần" */
  async #handleMessage(msg) {
    if (msg.author.bot)            return;
    if (!/đần/i.test(msg.content)) return;

    const result = await this._handleDanCommand(msg.content, (s) => msg.reply(s));
    if (result.handled) return;

    msg.channel.sendTyping();
    try {
      const text = await this._aiService.chat({
        channelId: msg.channelId,
        userId:    msg.author.id,
        username:  msg.author.username,
        prompt:    result.prompt,
        platform:  this._platform,
      });
      await msg.reply(this.#truncate(text));
    } catch (err) {
      console.error('[Discord] Message error:', err);
      await msg.reply(`❌ Error: ${err.message}`);
    }
  }

  /** @param {string} text @param {number} [max] */
  #truncate(text, max = 2000) {
    return text.length > max ? text.substring(0, max - 3) + '...' : text;
  }

  start() {
    this.#client.login(process.env.DISCORD_TOKEN);
  }
}

module.exports = DiscordBot;
