'use strict';

/**
 * Bot entry point — runs Discord & Telegram bots only.
 * Managed by pm2. The web dashboard runs separately via app.js (Phusion Passenger).
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const Database               = require('./src/models/Database');
const ConfigRepository       = require('./src/models/ConfigRepository');
const ConversationRepository = require('./src/models/ConversationRepository');
const UserRepository         = require('./src/models/UserRepository');
const AIService              = require('./src/services/AIService');
const DiscordBot             = require('./src/bots/DiscordBot');
const TelegramBot            = require('./src/bots/TelegramBot');

async function bootstrap() {
  const db = Database.getInstance();
  await db.init();

  const configRepo       = new ConfigRepository(db);
  await configRepo.init();

  const conversationRepo = new ConversationRepository(db);
  const userRepo         = new UserRepository(db);    // needed for future bot-side auth
  void userRepo;

  const aiService = new AIService(configRepo, conversationRepo);

  new DiscordBot(aiService).start();
  new TelegramBot(aiService).start();
}

bootstrap().catch((err) => {
  console.error('[bot] Fatal error during bootstrap:', err);
  process.exit(1);
});
