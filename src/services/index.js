'use strict';

module.exports = {
  // AI Domain
  AIService: require('@services/ai/AIService'),
  AgentLoop: require('@services/ai/AgentLoop'),
  ToolRegistry: require('@services/ai/ToolRegistry'),
  AIFactory: require('@services/ai/AIFactory'),
  AIProvider: require('@services/ai/AIProvider'),
  ProviderCatalog: require('@services/ai/ProviderCatalog'),

  // Learning Hub Domain
  LearningService: require('@services/learning/LearningService'),
  TechService: require('@services/learning/TechService'),
  VocabularyService: require('@services/learning/VocabularyService'),
  QuizEngine: require('@services/learning/QuizEngine'),
  ContentNormalizer: require('@services/learning/ContentNormalizer'),

  // OpenClaw Domain
  OpenClawService: require('@services/openclaw/OpenClawService'),
  OpenClawMonitorService: require('@services/openclaw/OpenClawMonitorService'),
  CeoCommandService: require('@services/openclaw/CeoCommandService'),
  ApprovalCommandService: require('@services/openclaw/ApprovalCommandService'),

  // Notification Domain
  DiscordNotificationService: require('@services/notification/DiscordNotificationService'),

  // Scheduler Domain
  SchedulerService: require('@services/scheduler/SchedulerService'),
  TaskService: require('@services/scheduler/TaskService'),

  // Config Domain
  ConfigService: require('@services/ConfigService'),
};
