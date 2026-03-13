'use strict';

/**
 * Web dashboard entry point — runs the HTTP dashboard only.
 * Served by Phusion Passenger. Bots run separately via bot.js (pm2).
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const bcrypt = require('bcryptjs');

// ── Data layer ──────────────────────────────────────────
const Database               = require('./src/models/Database');
const ConfigRepository       = require('./src/models/ConfigRepository');
const ConversationRepository = require('./src/models/ConversationRepository');
const UserRepository         = require('./src/models/UserRepository');

// ── Service layer ───────────────────────────────────────
const AIService = require('./src/services/AIService');

// ── Presentation / transport layer ─────────────────────
const DashboardServer = require('./src/server/DashboardServer');

async function bootstrap() {
  // 1. Initialise the database (creates tables if needed)
  const db = Database.getInstance();
  await db.init();

  // 2. Initialise repositories
  const configRepo       = new ConfigRepository(db);
  await configRepo.init();                        // seeds defaults & warms cache

  const conversationRepo = new ConversationRepository(db);
  const userRepo         = new UserRepository(db);

  // 3. Seed admin user
  //    Migration path: reuse existing hash from config table so the password
  //    set via the old dashboard is not lost on first restart.
  const adminUsername = process.env.ADMIN_USER || 'admin';
  const existingHash  = configRepo.get('dashboard_password');
  const adminHash     = existingHash ||
    (process.env.DASHBOARD_PASSWORD
      ? bcrypt.hashSync(process.env.DASHBOARD_PASSWORD, 10)
      : null);

  await userRepo.seedAdmin(adminUsername, adminHash);

  // 4. Compose services
  const aiService = new AIService(configRepo, conversationRepo);

  // 5. Start web dashboard only (bots are in bot.js, managed by pm2)
  const port = process.env.PORT || process.env.DASHBOARD_PORT || 3000;
  new DashboardServer({ aiService, configRepo, conversationRepo, userRepo }).start(port);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
