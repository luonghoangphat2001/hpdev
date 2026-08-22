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
const VocabularyRepository   = require('./src/models/VocabularyRepository');
const AIService              = require('./src/services/ai/AIService');
const SchedulerService       = require('./src/services/scheduler/SchedulerService');
const VocabularyService      = require('./src/services/learning/VocabularyService');
const DiscordBot             = require('./src/bots/DiscordBot');
const TelegramBot            = require('./src/bots/TelegramBot');
const OpenClawService        = require('./src/services/openclaw/OpenClawService');
const OpenClawRepository     = require('./src/models/OpenClawRepository');
const DiscordNotificationRepository = require('./src/models/DiscordNotificationRepository');
const DiscordNotificationService = require('./src/services/notification/DiscordNotificationService');

async function bootstrap() {
  const db = Database.getInstance();
  await db.init();

  const configRepo       = new ConfigRepository(db);
  await configRepo.init();

  const conversationRepo = new ConversationRepository(db);
  const userRepo         = new UserRepository(db);    // needed for future bot-side auth
  void userRepo;

  const aiService        = new AIService(configRepo, conversationRepo);
  const openClawUrl      = process.env.OPENCLAW_URL || process.env.OPENCLAW_BASE_URL || configRepo.get('openclaw_url') || '';
  const openClaw         = new OpenClawService(
    openClawUrl,
    process.env.OPENCLAW_SECRET  || '',
    parseInt(process.env.OPENCLAW_TIMEOUT_MS || '30000', 10)
  );
  const scheduleRepo     = new ScheduleRepository(db);
  const vocabRepo        = new VocabularyRepository(db);
  const vocabService     = new VocabularyService(vocabRepo, configRepo);
  const schedulerService = new SchedulerService(scheduleRepo, configRepo, vocabService);
  const openClawRepo     = new OpenClawRepository(db);
  const discordNotificationRepo = new DiscordNotificationRepository(db);
  const discordNotificationService = new DiscordNotificationService(discordNotificationRepo, configRepo);

  const discordBot = new DiscordBot(aiService, schedulerService, openClaw, configRepo, openClawRepo);
  discordBot.start();

  // Inject Discord client into scheduler once bot is up
  const client = discordBot.getClient();
  client.once('clientReady', () => {
    schedulerService.setDiscordClient(client);
    schedulerService.start();
    vocabService.setDiscordClient(client);
    discordNotificationService.setDiscordClient(client);
    setInterval(
      () => discordNotificationService.deliverPending().catch((error) =>
        console.error('[DiscordNotification] delivery tick failed:', error.message)),
      10_000
    );
    discordNotificationService.deliverPending().catch((error) =>
      console.error('[DiscordNotification] initial delivery failed:', error.message));
  });

  new TelegramBot(aiService, openClaw, configRepo, openClawRepo, schedulerService).start();
}

bootstrap().catch((err) => {
  console.error('[bot] Fatal error during bootstrap:', err);
  process.exit(1);
});
