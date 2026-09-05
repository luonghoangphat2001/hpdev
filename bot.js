'use strict';

/**
 * Bot entry point — runs Discord & Telegram bots only.
 * Managed by pm2. The web dashboard runs separately via app.js (Phusion Passenger).
 */

require('module-alias')(__dirname);
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('@utils/Logger').init();

const Database = require('@models/Database');
const ConfigRepository = require('@models/ConfigRepository');
const ConversationRepository = require('@models/ConversationRepository');
const UserRepository = require('@models/UserRepository');
const ScheduleRepository = require('@models/ScheduleRepository');
const VocabularyRepository = require('@models/VocabularyRepository');
const AIService = require('@services/ai/AIService');
const SchedulerService = require('@services/scheduler/SchedulerService');
const VocabularyService = require('@services/learning/VocabularyService');
const DiscordBot = require('@bots/DiscordBot');
const TelegramBot = require('@bots/TelegramBot');
const OpenClawService = require('@services/openclaw/OpenClawService');
const OpenClawRepository = require('@models/OpenClawRepository');
const DiscordNotificationRepository = require('@models/DiscordNotificationRepository');
const DiscordNotificationService = require('@services/notification/DiscordNotificationService');

async function bootstrap() {
  const db = Database.getInstance();
  await db.init();

  const configRepo = new ConfigRepository(db);
  await configRepo.init();

  const conversationRepo = new ConversationRepository(db);
  const userRepo = new UserRepository(db); // needed for future bot-side auth
  void userRepo;

  const aiService = new AIService(configRepo, conversationRepo);
  const openClawUrl = process.env.OPENCLAW_API_URL;
  if (!openClawUrl) {
    throw new Error('[bot] OPENCLAW_API_URL is required in environment');
  }
  const openClawSecret = process.env.OPENCLAW_API_SECRET;
  if (!openClawSecret) {
    throw new Error('[bot] OPENCLAW_API_SECRET is required in environment');
  }
  const openClawTimeoutRaw = process.env.OPENCLAW_TIMEOUT_MS;
  if (!openClawTimeoutRaw) {
    throw new Error('[bot] OPENCLAW_TIMEOUT_MS is required in environment');
  }
  const openClawTimeout = parseInt(openClawTimeoutRaw, 10);
  if (isNaN(openClawTimeout)) {
    throw new Error('[bot] OPENCLAW_TIMEOUT_MS must be a valid integer');
  }
  const openClaw = new OpenClawService(
    openClawUrl,
    openClawSecret,
    openClawTimeout
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
