'use strict';

const { Router } = require('express');
const multer = require('multer');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const ServiceAuthMiddleware = require('../middleware/ServiceAuthMiddleware');
const APP_VERSION = require('../config/express/version');

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Mount all REST API endpoints.
 *
 * @param {{
 *   auth:      import('../controllers/AuthController'),
 *   chat:      import('../controllers/ChatController'),
 *   config:    import('../controllers/ConfigController'),
 *   history:   import('../controllers/HistoryController'),
 *   stats:     import('../controllers/StatsController'),
 *   models:    import('../controllers/ModelsController'),
 *   user:      import('../controllers/UserController'),
 *   log:       import('../controllers/LogController'),
 *   openclaw:  import('../controllers/OpenClawController'),
 *   task:      import('../controllers/TaskController'),
 *   studySchedule: import('../controllers/StudyScheduleController'),
 *   vocabulary: import('../controllers/VocabularyController'),
 *   quiz:      import('../controllers/QuizController'),
 *   tech:      import('../controllers/TechController'),
 *   learning:  import('../controllers/LearningController'),
 *   discordNotification: import('../controllers/DiscordNotificationController'),
 * }} controllers
 * @returns {import('express').Router}
 */
function createApiRouter(controllers) {
  const router = Router();
  const { user: authUser, admin: authAdmin } = AuthMiddleware;

  // ─── Public & service-to-service ─────────────────────────────────────────
  const publicRouter = Router();
  publicRouter.get('/health', (_req, res) => res.json({ ok: true, version: APP_VERSION }));
  publicRouter.post('/login', controllers.auth.login);
  publicRouter.post('/logout', controllers.auth.logout);
  publicRouter.post(
    '/integrations/openclaw/discord-notifications',
    ServiceAuthMiddleware.openClaw,
    controllers.discordNotification.create
  );
  router.use('/', publicRouter);


  // ─── Any authenticated user ───────────────────────────────────────────────
  const userRouter = Router();
  userRouter.get('/me', authUser, controllers.auth.getMe);
  userRouter.post('/chat', authUser, controllers.chat.handle);
  userRouter.post('/password', authUser, controllers.user.changePassword);
  router.use('/', userRouter);

  // ─── Admin: configuration, models and analytics ───────────────────────────
  const configRouter = Router();
  configRouter.get('/', authAdmin, controllers.config.get);
  configRouter.post('/', authAdmin, controllers.config.update);
  router.use('/config', configRouter);

  const modelsRouter = Router();
  modelsRouter.get('/:provider', authAdmin, controllers.models.list);
  router.use('/models', modelsRouter);

  const historyRouter = Router();
  historyRouter.get('/', authAdmin, controllers.history.get);
  router.use('/history', historyRouter);

  const statsRouter = Router();
  statsRouter.get('/', authAdmin, controllers.stats.get);
  router.use('/stats', statsRouter);

  // ─── Admin: user management ───────────────────────────────────────────────
  const usersRouter = Router();
  usersRouter.get('/', authAdmin, controllers.user.list);
  usersRouter.post('/', authAdmin, controllers.user.create);
  usersRouter.delete('/:username', authAdmin, controllers.user.remove);
  usersRouter.post('/:username/password', authAdmin, controllers.user.updateUserPassword);
  router.use('/users', usersRouter);

  // ─── Admin: application logs ──────────────────────────────────────────────
  const logsRouter = Router();
  logsRouter.get('/', authAdmin, controllers.log.list);
  logsRouter.post('/clean', authAdmin, controllers.log.clean);
  logsRouter.get('/:filename/content', authAdmin, controllers.log.view);
  logsRouter.get('/:filename', authAdmin, controllers.log.download);
  router.use('/logs', logsRouter);

  if (controllers.openclaw) {
    const openClawRouter = Router();
    openClawRouter.get('/overview', authAdmin, controllers.openclaw.overview);
    openClawRouter.get('/agents', authAdmin, controllers.openclaw.agents);
    openClawRouter.post('/agents/:agentId/control', authAdmin, controllers.openclaw.controlAgent);
    openClawRouter.get('/workflows', authAdmin, controllers.openclaw.workflows);
    openClawRouter.get('/workflows/:workflowId', authAdmin, controllers.openclaw.workflowDetail);
    router.use('/openclaw', openClawRouter);

    // Legacy endpoint kept unchanged for dashboard compatibility.
    router.get('/openclaw-logs', authAdmin, controllers.openclaw.list);
  }

  // Mission Control — background tasks
  if (controllers.task) {
    const taskRouter = Router();
    taskRouter.get('/', authAdmin, controllers.task.list);
    taskRouter.get('/:id', authAdmin, controllers.task.get);
    router.use('/tasks', taskRouter);
  }

  // Study schedules (Schedule / Lịch trình)
  if (controllers.studySchedule) {
    const scheduleRouter = Router();
    scheduleRouter.get('/', authAdmin, controllers.studySchedule.list);
    scheduleRouter.post('/', authAdmin, controllers.studySchedule.create);
    scheduleRouter.put('/:id', authAdmin, controllers.studySchedule.update);
    scheduleRouter.delete('/:id', authAdmin, controllers.studySchedule.remove);
    router.use('/study-schedules', scheduleRouter);
  }

  // Daily vocabulary notifications
  if (controllers.vocabulary) {
    const vocabularyRouter = Router();

    vocabularyRouter.get('/config', authAdmin, controllers.vocabulary.getConfig);
    vocabularyRouter.post('/config', authAdmin, controllers.vocabulary.updateConfig);

    vocabularyRouter.get('/topics', authAdmin, controllers.vocabulary.topics);
    vocabularyRouter.put('/topics/:topicNo', authAdmin, controllers.vocabulary.updateTopic);

    vocabularyRouter.get('/words', authAdmin, controllers.vocabulary.words);
    vocabularyRouter.post('/words', authAdmin, controllers.vocabulary.createWord);
    vocabularyRouter.put('/words/:id', authAdmin, controllers.vocabulary.updateWord);
    vocabularyRouter.delete('/words/:id', authAdmin, controllers.vocabulary.deleteWord);
    vocabularyRouter.post('/words/:id/send-discord', authAdmin, controllers.vocabulary.sendWordToDiscord);

    vocabularyRouter.post('/import', authAdmin, importUpload.single('file'), controllers.vocabulary.importWords);
    vocabularyRouter.get('/export', authAdmin, controllers.vocabulary.exportWords);
    vocabularyRouter.post('/fill-pronunciations', authAdmin, controllers.vocabulary.fillPronunciations);
    vocabularyRouter.get('/history', authAdmin, controllers.vocabulary.history);

    router.use('/vocabulary', vocabularyRouter);
  }

  // Quiz interactive endpoints
  if (controllers.quiz) {
    const quizRouter = Router();
    quizRouter.get('/generate', authUser, controllers.quiz.generate);
    quizRouter.post('/submit', authUser, controllers.quiz.submit);
    quizRouter.get('/leaderboard', authUser, controllers.quiz.leaderboard);
    quizRouter.get('/history', authUser, controllers.quiz.history);
    router.use('/quiz', quizRouter);
  }

  // Tech Learning endpoints
  if (controllers.tech) {
    const techRouter = Router();

    // User: learning and progress
    techRouter.get('/stacks', authUser, controllers.tech.getStacks);
    techRouter.get('/stacks/:stackId/topics', authUser, controllers.tech.getTopics);
    techRouter.get('/questions', authUser, controllers.tech.getQuestions);
    techRouter.get('/questions/:id', authUser, controllers.tech.getQuestionDetail);
    techRouter.post('/questions/:id/progress', authUser, controllers.tech.updateProgress);
    techRouter.post('/ai-mock-interview', authUser, controllers.tech.mockInterviewAI);

    // Admin: question management and import/export
    techRouter.post('/questions', authAdmin, controllers.tech.createQuestion);
    techRouter.put('/questions/:id', authAdmin, controllers.tech.updateQuestion);
    techRouter.delete('/questions/:id', authAdmin, controllers.tech.deleteQuestion);
    techRouter.post('/ai-generate', authAdmin, controllers.tech.generateAIQuestion);
    techRouter.post('/ai-batch-generate', authAdmin, controllers.tech.batchGenerateAIQuestions);
    techRouter.post('/import', authAdmin, importUpload.single('file'), controllers.tech.importQuestions);
    techRouter.get('/export', authAdmin, controllers.tech.exportQuestions);

    router.use('/tech', techRouter);
  }

  // ─── UNIFIED LEARNING HUB API (Tech & English) ─────────
  if (controllers.learning) {
    const learningRouter = Router();

    // Categories & Learning topics
    learningRouter.get('/categories', authUser, controllers.learning.categories);
    learningRouter.get('/learnings', authUser, controllers.learning.learnings);
    learningRouter.get('/learnings/:slug', authUser, controllers.learning.learningDetail);
    learningRouter.put('/topics/:id', authAdmin, controllers.learning.updateTopic);

    // Items list & detail
    learningRouter.get('/items', authUser, controllers.learning.items);
    learningRouter.get('/items/:id', authUser, controllers.learning.itemDetail);

    // Progress, Bookmark, Learning History & Stats
    learningRouter.post('/items/:id/progress', authUser, controllers.learning.updateProgress);
    learningRouter.get('/history', authUser, controllers.learning.history);
    learningRouter.get('/stats/summary', authUser, controllers.learning.userStats);

    // AI Evaluation (Mock Interview, Essay grading, IELTS score)
    learningRouter.post('/ai/evaluate', authUser, controllers.learning.evaluateAI);

    // Quiz Interactive & Leaderboard
    learningRouter.get('/practice-exam', authUser, controllers.learning.buildPracticeExam);
    learningRouter.post('/practice-exam/submit', authUser, controllers.learning.submitPracticeExam);
    learningRouter.get('/quiz/generate', authUser, controllers.learning.buildQuiz);
    learningRouter.post('/quiz/submit', authUser, controllers.learning.submitQuiz);
    learningRouter.get('/quiz/leaderboard', authUser, controllers.learning.getLeaderboard);

    // Admin Learning Management
    learningRouter.post('/items', authAdmin, controllers.learning.createItem);
    learningRouter.put('/items/:id', authAdmin, controllers.learning.updateItem);
    learningRouter.delete('/items/:id', authAdmin, controllers.learning.deleteItem);

    // AI Generation (Tech questions, Vocab batch/single, Quizzes, Reading/Writing, Speaking, IELTS)
    learningRouter.post('/ai/generate', authAdmin, controllers.learning.generateAI);
    learningRouter.post('/ai/save-batch', authAdmin, controllers.learning.saveAIBatch);

    // US IPA Pronunciation auto-fetch
    learningRouter.post('/vocabulary/fill-pronunciations', authAdmin, controllers.learning.fillPronunciations);

    // Discord Notifications Config & Instant Send
    learningRouter.get('/config', authAdmin, controllers.learning.getConfig);
    learningRouter.post('/config', authAdmin, controllers.learning.updateConfig);
    learningRouter.post('/items/:id/discord', authAdmin, controllers.learning.sendDiscord);

    // Excel Export & Import
    learningRouter.get('/export/:slug?', authAdmin, controllers.learning.exportExcel);
    learningRouter.post('/import/:id', authAdmin, importUpload.single('file'), controllers.learning.importExcel);

    router.use('/learning', learningRouter);
  }

  return router;
}

module.exports = createApiRouter;
