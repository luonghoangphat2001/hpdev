'use strict';

const AuthController = require('../../controllers/AuthController');
const ChatController = require('../../controllers/ChatController');
const ConfigController = require('../../controllers/ConfigController');
const HistoryController = require('../../controllers/HistoryController');
const LogController = require('../../controllers/LogController');
const ModelsController = require('../../controllers/ModelsController');
const OpenClawController = require('../../controllers/OpenClawController');
const StatsController = require('../../controllers/StatsController');
const StudyScheduleController = require('../../controllers/StudyScheduleController');
const TaskController = require('../../controllers/TaskController');
const UserController = require('../../controllers/UserController');
const LearningController = require('../../controllers/LearningController');
const VocabularyController = require('../../controllers/VocabularyController');
const QuizController = require('../../controllers/QuizController');
const TechController = require('../../controllers/TechController');
const DiscordNotificationController = require('../../controllers/DiscordNotificationController');
const OpenClawMonitorService = require('../../services/openclaw/OpenClawMonitorService');

function buildControllers(dependencies) {
  const {
    aiService,
    configRepo,
    conversationRepo,
    userRepo,
    openClaw,
    openClawRepo,
    scheduleRepo,
    learningRepo,
    learningService,
    vocabRepo,
    vocabService,
    quizEngine,
    techRepo,
    techService,
    discordNotificationService,
    taskRepo,
    ceoDashboardActorId,
  } = dependencies;

  return {
    auth: new AuthController(userRepo),
    chat: new ChatController(aiService),
    config: new ConfigController(configRepo),
    history: new HistoryController(conversationRepo),
    log: new LogController(),
    models: new ModelsController(configRepo),
    openclaw: new OpenClawController(new OpenClawMonitorService(
      openClaw,
      openClawRepo,
      { ceoActorId: ceoDashboardActorId, configRepo },
    )),
    stats: new StatsController(conversationRepo),
    studySchedule: scheduleRepo ? new StudyScheduleController(scheduleRepo) : null,
    task: new TaskController(taskRepo),
    user: new UserController(userRepo),
    learning: learningRepo && learningService ? new LearningController(learningRepo, learningService) : null,
    vocabulary: vocabRepo && vocabService ? new VocabularyController(vocabRepo, vocabService) : null,
    quiz: quizEngine ? new QuizController(quizEngine) : null,
    tech: techRepo && techService ? new TechController(techRepo, techService) : null,
    discordNotification: new DiscordNotificationController(discordNotificationService),
  };
}

module.exports = buildControllers;
