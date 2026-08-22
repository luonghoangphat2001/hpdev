'use strict';

module.exports = {
  // AI Domain
  AIService: require('./ai/AIService'),
  AgentLoop: require('./ai/AgentLoop'),
  ToolRegistry: require('./ai/ToolRegistry'),
  AIFactory: require('./ai/AIFactory'),
  AIProvider: require('./ai/AIProvider'),
  ProviderCatalog: require('./ai/ProviderCatalog'),

  // Learning Hub Domain
  LearningService: require('./learning/LearningService'),
  TechService: require('./learning/TechService'),
  VocabularyService: require('./learning/VocabularyService'),
  QuizEngine: require('./learning/QuizEngine'),
  ContentNormalizer: require('./learning/ContentNormalizer'),

  // OpenClaw Domain
  OpenClawService: require('./openclaw/OpenClawService'),
  OpenClawMonitorService: require('./openclaw/OpenClawMonitorService'),
  CeoCommandService: require('./openclaw/CeoCommandService'),
  ApprovalCommandService: require('./openclaw/ApprovalCommandService'),

  // Notification Domain
  DiscordNotificationService: require('./notification/DiscordNotificationService'),

  // Scheduler Domain
  SchedulerService: require('./scheduler/SchedulerService'),
  TaskService: require('./scheduler/TaskService'),

  // Config Domain
  ConfigService: require('./ConfigService'),
};
