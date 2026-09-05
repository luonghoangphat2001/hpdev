'use strict';

const config = require('@config');
const AIService = require('@services/ai/AIService');
const OpenClawService = require('@services/openclaw/OpenClawService');
const LearningService = require('@services/learning/LearningService');
const VocabularyService = require('@services/learning/VocabularyService');
const QuizEngine = require('@services/learning/QuizEngine');
const TechService = require('@services/learning/TechService');
const DiscordNotificationService = require('@services/notification/DiscordNotificationService');

async function createServices(repositories) {
  const {
    userRepo,
    configRepo,
    conversationRepo,
    learningRepo,
    vocabRepo,
    quizRepo,
    techRepo,
    discordNotificationRepo,
    insightRepo,
  } = repositories;

  if (userRepo) {
    await userRepo.ensureDefaultAdmin();
  }

  const aiService = new AIService(configRepo, conversationRepo, insightRepo);
  const openClaw = new OpenClawService(
    config.openclaw.apiUrl,
    config.openclaw.apiSecret,
    config.openclaw.timeoutMs,
  );

  const techService = new TechService(techRepo, aiService, configRepo);
  await techService.seedInitialBankIfEmpty();

  return {
    aiService,
    openClaw,
    learningService: new LearningService(learningRepo, aiService, configRepo),
    vocabService: new VocabularyService(vocabRepo, configRepo),
    quizEngine: new QuizEngine(vocabRepo, quizRepo),
    techService,
    discordNotificationService: new DiscordNotificationService(discordNotificationRepo, configRepo),
  };
}

module.exports = createServices;
