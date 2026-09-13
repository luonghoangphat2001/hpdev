'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const SEED_OWNER = 'seed-python-student-pdf';
const LEVEL = 'student';

async function seedPythonStudentQuiz(db) {
  const dataPath = path.join(__dirname, 'python_student_quiz_enriched.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data file not found: ${dataPath}`);
  }

  const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`[Seed] Loaded ${items.length} questions from ${dataPath}`);

  await db.beginTransaction();
  try {
    const [learningRows] = await db.execute(
      "SELECT id FROM learning WHERE slug = 'python' AND type = 'tech_question' LIMIT 1"
    );
    if (!learningRows.length) {
      throw new Error("Learning stack 'python' not found in database.");
    }
    const learningId = learningRows[0].id;

    // Clean existing student seed questions to allow re-enrichment and updates
    await db.execute(
      `DELETE FROM learning_item WHERE learning_id = ? AND level = ? AND created_by = ?`,
      [learningId, LEVEL, SEED_OWNER]
    );

    let created = 0;
    if (items.length > 0) {
      const placeholders = items
        .map(() => "(?, 'tech_question', ?, ?, ?, ?, ?, ?, 1, ?)")
        .join(', ');

      const params = items.flatMap((item) => [
        learningId,
        item.title,
        item.prompt,
        LEVEL,
        JSON.stringify(item.content),
        JSON.stringify(item.sample_solution),
        item.tags,
        SEED_OWNER,
      ]);

      const [result] = await db.execute(
        `INSERT INTO learning_item
         (learning_id, type, title, prompt, level, content, sample_solution, tags, is_active, created_by)
         VALUES ${placeholders}`,
        params
      );
      created = result.affectedRows || 0;
    }

    await db.commit();
    return { ok: true, created, total: items.length };
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

async function createDbConnection() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const user = process.env.DB_USER || 'dan_ai_user';
  const password = process.env.DB_PASSWORD && process.env.DB_PASSWORD !== 'your_secure_password'
    ? process.env.DB_PASSWORD
    : 'dan_ai_password';
  const database = process.env.DB_NAME || 'dan_ai';
  const primaryPort = Number(process.env.DB_PORT || 3306);
  const fallbackPort = 3308;

  try {
    console.log(`[Seed] Connecting to MySQL at ${host}:${primaryPort}, database=${database}...`);
    return await mysql.createConnection({ host, port: primaryPort, user, password, database });
  } catch (err) {
    if (primaryPort !== fallbackPort && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')) {
      console.log(`[Seed] Port ${primaryPort} refused, retrying fallback port ${fallbackPort}...`);
      return await mysql.createConnection({ host, port: fallbackPort, user, password, database });
    }
    throw err;
  }
}

async function main() {
  const db = await createDbConnection();
  try {
    const res = await seedPythonStudentQuiz(db);
    console.log('[Seed] Result:', JSON.stringify(res, null, 2));
  } finally {
    await db.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[Seed Error]:', error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  seedPythonStudentQuiz,
};
