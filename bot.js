'use strict';

/**
 * Bot entry point — runs Discord & Telegram bots only.
 * Managed by pm2. The web dashboard runs separately via app.js (Phusion Passenger).
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('./src/utils/Logger').init();

const Database               = require('./src/models/Database');
const ConfigRepository       = require('./src/models/ConfigRepository');
const ConversationRepository = require('./src/models/ConversationRepository');
const UserRepository         = require('./src/models/UserRepository');
const ScheduleRepository     = require('./src/models/ScheduleRepository');
const AIService              = require('./src/services/AIService');
const SchedulerService       = require('./src/services/SchedulerService');
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

  const aiService        = new AIService(configRepo, conversationRepo);
  const scheduleRepo     = new ScheduleRepository(db);
  const schedulerService = new SchedulerService(scheduleRepo, configRepo);

  const discordBot = new DiscordBot(aiService, schedulerService);
  discordBot.start();

  // Inject Discord client into scheduler once bot is up
  const client = discordBot.getClient();
  client.once('clientReady', () => {
    schedulerService.setDiscordClient(client);
    schedulerService.start();
  });

  new TelegramBot(aiService).start();
}

bootstrap().catch((err) => {
  console.error('[bot] Fatal error during bootstrap:', err);
  process.exit(1);
});
