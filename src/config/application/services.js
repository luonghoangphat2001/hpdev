'use strict';

const AIService = require('../../services/ai/AIService');
const OpenClawService = require('../../services/openclaw/OpenClawService');
const LearningService = require('../../services/learning/LearningService');
const VocabularyService = require('../../services/learning/VocabularyService');
const QuizEngine = require('../../services/learning/QuizEngine');
const TechService = require('../../services/learning/TechService');
const DiscordNotificationService = require('../../services/notification/DiscordNotificationService');

async function createServices(repositories) {
  const {
    configRepo,
    conversationRepo,
    learningRepo,
    vocabRepo,
    quizRepo,
    techRepo,
    discordNotificationRepo,
    insightRepo,
  } = repositories;

  const aiService = new AIService(configRepo, conversationRepo, insightRepo);
  const openClawUrl = process.env.OPENCLAW_URL
    || process.env.OPENCLAW_BASE_URL
    || configRepo.get('openclaw_url')
    || '';
  const openClaw = new OpenClawService(
    openClawUrl,
    process.env.OPENCLAW_SECRET || '',
    parseInt(process.env.OPENCLAW_TIMEOUT_MS || '30000', 10),
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
