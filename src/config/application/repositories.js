'use strict';

const Database = require('../../models/Database');
const ConfigRepository = require('../../models/ConfigRepository');
const ConversationRepository = require('../../models/ConversationRepository');
const UserRepository = require('../../models/UserRepository');
const OpenClawRepository = require('../../models/OpenClawRepository');
const ScheduleRepository = require('../../models/ScheduleRepository');
const LearningRepository = require('../../models/LearningRepository');
const VocabularyRepository = require('../../models/VocabularyRepository');
const QuizRepository = require('../../models/QuizRepository');
const TechRepository = require('../../models/TechRepository');
const DiscordNotificationRepository = require('../../models/DiscordNotificationRepository');
const TaskRepository = require('../../models/TaskRepository');
const InsightRepository = require('../../models/InsightRepository');

async function createRepositories() {
  const db = Database.getInstance();
  await db.init();

  const configRepo = new ConfigRepository(db);
  await configRepo.init();

  return {
    configRepo,
    conversationRepo: new ConversationRepository(db),
    userRepo: new UserRepository(db),
    openClawRepo: new OpenClawRepository(db),
    scheduleRepo: new ScheduleRepository(db),
    learningRepo: new LearningRepository(db),
    vocabRepo: new VocabularyRepository(db),
    quizRepo: new QuizRepository(db),
    techRepo: new TechRepository(db),
    discordNotificationRepo: new DiscordNotificationRepository(db),
    taskRepo: new TaskRepository(db),
    insightRepo: new InsightRepository(db),
  };
}

module.exports = createRepositories;
