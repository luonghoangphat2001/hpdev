'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

const banks = {
  php: {
    name: 'PHP',
    topics: ['khai báo kiểu dữ liệu', 'strict_types', 'kế thừa trong OOP', 'Interface và Abstract Class', 'Trait', 'Closure', 'Generator', 'Exception', 'PDO Prepared Statement', 'transaction', 'phòng chống SQL Injection', 'bảo mật session', 'băm mật khẩu', 'chuẩn PSR', 'Composer Autoloading', 'validate REST API', 'upload file', 'cache dữ liệu', 'OPcache', 'Dependency Injection'],
    code: (t) => `<?php\nfinal class Example {\n    public function handle(string $input): mixed {\n        // Apply ${t} safely\n        return trim($input);\n    }\n}`,
    answer: (t) => `Trong PHP, ${t} nên được xử lý ở ranh giới của ứng dụng bằng type rõ ràng, kiểm tra lỗi và tách trách nhiệm.`,
  },
  nextjs: {
    name: 'Next.js',
    topics: ['App Router', 'Server Components', 'Client Components', 'Route Handler', 'Middleware', 'Dynamic Route', 'Loading và Error UI', 'lấy dữ liệu', 'revalidation', 'ISR', 'Server Actions', 'xác thực người dùng', 'phân quyền', 'caching', 'Metadata và SEO', 'tối ưu hình ảnh', 'streaming', 'Edge Runtime', 'biến môi trường', 'deploy production'],
    code: (t) => `export async function GET() {\n  const data = await fetch(process.env.API_URL!, {\n    next: { revalidate: 60 },\n  }).then((r) => r.json());\n  return Response.json({ topic: '${t}', data });\n}`,
    answer: (t) => `Trong Next.js, ${t} cần phân biệt rõ phần chạy trên server và client, đồng thời kiểm soát cache, lỗi và quyền truy cập.`,
  },
  python: {
    name: 'Python',
    topics: ['Data Model', 'Decorator', 'Context Manager', 'Iterator', 'Generator', 'Type Hinting', 'Dataclass', 'Exception', 'Asyncio', 'Threading và Multiprocessing', 'GIL', 'validate với FastAPI', 'SQLAlchemy Session', 'Dependency Injection', 'Pytest Fixture', 'logging', 'cache dữ liệu', 'bảo mật', 'profiling hiệu năng', 'quản lý package'],
    code: (t) => `from typing import Callable\n\ndef handle(value: str) -> str:\n    """Apply ${t} with an explicit contract."""\n    if not value:\n        raise ValueError("value is required")\n    return value.strip()`,
    answer: (t) => `Trong Python, ${t} nên đi kèm contract rõ ràng, xử lý exception đúng tầng và kiểm thử hành vi quan trọng.`,
  },
  reactjs: {
    name: 'React.js',
    topics: ['composition component', 'props và state', 'useEffect', 'useMemo và useCallback', 'useRef', 'Custom Hook', 'form controlled', 'Context API', 'Reducer State', 'Error Boundary', 'vòng đời render', 'key và reconciliation', 'profiling hiệu năng', 'Suspense', 'Optimistic UI', 'Accessibility', 'test component', 'quản lý state', 'lấy dữ liệu', 'bảo mật'],
    code: (t) => `import { useMemo } from 'react';\n\nexport function TopicView({ items }) {\n  const visible = useMemo(() =>\n    items.filter((item) => item.topic === '${t}'), [items]\n  );\n  return <ul>{visible.map((item) => <li key={item.id}>{item.name}</li>)}</ul>;\n}`,
    answer: (t) => `Trong React, ${t} cần giữ component đơn giản, state tối thiểu và tránh render lại không cần thiết.`,
  },
  javascript: {
    name: 'JavaScript',
    topics: ['Event Loop', 'Microtask và Macrotask', 'Closure', 'Prototype Chain', 'this binding', 'ES Modules', 'Promise', 'Async/Await', 'Iterator', 'Generator', 'Symbol', 'WeakMap', 'immutability', 'deep clone', 'xử lý lỗi', 'Fetch và AbortController', 'Web Worker', 'memory leak', 'bảo mật frontend', 'tối ưu hiệu năng'],
    code: (t) => `async function run${t.replace(/[^a-z0-9]/gi, '') || 'Task'}(signal) {\n  const response = await fetch('/api/data', { signal });\n  if (!response.ok) throw new Error('Request failed');\n  return response.json();\n}`,
    answer: (t) => `Trong JavaScript, ${t} cần hiểu đúng runtime, vòng đời bất đồng bộ và cách giải phóng tài nguyên sau mỗi tác vụ.`,
  },
  nodejs: {
    name: 'Node.js',
    topics: ['Event Loop', 'Libuv Thread Pool', 'Stream', 'Backpressure', 'Worker Threads', 'Cluster', 'HTTP Server', 'Fastify Middleware', 'xử lý lỗi Express', 'thiết kế REST API', 'xác thực người dùng', 'Rate Limiting', 'connection pool database', 'transaction', 'message queue', 'Graceful Shutdown', 'observability', 'testing', 'bảo mật Node.js', 'tối ưu hiệu năng'],
    code: (t) => `import http from 'node:http';\n\nconst server = http.createServer(async (_req, res) => {\n  try {\n    res.writeHead(200, { 'content-type': 'application/json' });\n    res.end(JSON.stringify({ topic: '${t}' }));\n  } catch (error) { res.writeHead(500); res.end(); }\n});\nserver.listen(3000);`,
    answer: (t) => `Trong Node.js, ${t} cần được thiết kế không chặn event loop, có timeout, xử lý lỗi và đóng tài nguyên đúng cách.`,
  },
};

const SEED_OWNER = 'seed-tech-100-v1';
const LEGACY_SEED_OWNER = 'seed-tech-120';
const levels = ['beginner', 'junior', 'intermediate', 'advanced'];

const questionVariants = [
  {
    title: (topic) => `${topic}: bản chất và trường hợp sử dụng`,
    prompt: (topic, name) => `Giải thích bản chất của ${topic} trong ${name}, kèm ví dụ thực tế và một trường hợp nên tránh.`,
    focus: 'khái niệm cốt lõi, điều kiện áp dụng và giới hạn',
  },
  {
    title: (topic, name) => `Áp dụng ${topic} đúng cách trong ${name}`,
    prompt: (topic, name) => `Trình bày từng bước áp dụng ${topic} trong ${name}, gồm cách kiểm tra đầu vào, xử lý lỗi và kiểm thử.`,
    focus: 'quy trình triển khai, validation và kiểm thử',
  },
  {
    title: (topic, name) => `So sánh ${topic} trong ${name}`,
    prompt: (topic, name) => `So sánh ${topic} với cách tiếp cận khác trong ${name}. Nêu trade-off về hiệu năng, bảo trì và an toàn.`,
    focus: 'trade-off về hiệu năng, bảo trì và an toàn',
  },
  {
    title: (topic) => `Thiết kế ${topic} cho hệ thống production`,
    prompt: (topic) => `Thiết kế giải pháp dùng ${topic} trong production. Trình bày luồng xử lý, lỗi có thể xảy ra và cách kiểm thử.`,
    focus: 'kiến trúc production, failure mode và observability',
  },
  {
    title: (topic) => `Debug và tối ưu ${topic} khi tải tăng`,
    prompt: (topic, name) => `Ứng dụng ${name} lỗi hoặc chậm ở ${topic} khi traffic tăng. Nêu cách tái hiện, đo lường, sửa và ngăn tái diễn.`,
    focus: 'debug có hệ thống, đo lường và tối ưu tải lớn',
  },
];

function buildSeedItems(slug, bank) {
  return bank.topics.flatMap((topic, topicIndex) => questionVariants.map((variant, variantIndex) => {
    const level = levels[(topicIndex + variantIndex) % levels.length];
    const answer = bank.answer(topic);
    const title = variant.title(topic, bank.name);
    const prompt = variant.prompt(topic, bank.name);

    return {
      title,
      prompt,
      level,
      content: {
        quick_answer: answer,
        detailed_answer: `Phân tích chuyên sâu về ${variant.focus}: ${answer} Cần làm rõ boundary, failure case, hiệu năng, bảo mật và khả năng kiểm thử trước khi đưa vào production.`,
        code_example: bank.code(topic),
        interview_tips: `Nêu ${variant.focus}, một trade-off và một failure case của ${topic}.`,
        practical_tips: `Bắt đầu bằng test nhỏ, log có cấu trúc, đo baseline và kiểm tra input trước khi tối ưu ${topic}.`,
      },
      sampleSolution: {
        key_takeaways: `${answer} Trọng tâm đánh giá: ${variant.focus}.`,
      },
      tags: `${slug}, interview, theory, ${level}, seed:v1`,
    };
  }));
}

async function seedTechLearning(db) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  await db.beginTransaction();
  try {
    for (const [slug, bank] of Object.entries(banks)) {
      const [learningRows] = await db.execute(
        'SELECT id FROM learning WHERE slug = ? AND type = \'tech_question\' LIMIT 1',
        [slug]
      );
      if (!learningRows.length) throw new Error(`Learning stack not found: ${slug}`);
      const learningId = learningRows[0].id;
      const items = buildSeedItems(slug, bank);
      const [existingRows] = await db.execute(
        `SELECT id, title, created_by
         FROM learning_item
         WHERE learning_id = ? AND type = 'tech_question'`,
        [learningId]
      );
      const existingByTitle = new Map(existingRows.map((row) => [String(row.title).trim(), row]));
      const inserts = [];

      for (const item of items) {
        const existing = existingByTitle.get(item.title);
        const values = [
          item.prompt,
          item.level,
          JSON.stringify(item.content),
          JSON.stringify(item.sampleSolution),
          item.tags,
        ];

        if (!existing) {
          inserts.push([learningId, item.title, ...values]);
          continue;
        }

        if (existing.created_by === SEED_OWNER) {
          skipped++;
          continue;
        }

        if (existing.created_by !== LEGACY_SEED_OWNER) {
          // Preserve manually-created or AI-generated content on title collision.
          skipped++;
          continue;
        }

        const [result] = await db.execute(
          `UPDATE learning_item
           SET prompt = ?, level = ?, content = ?, sample_solution = ?, tags = ?,
               is_active = 1, created_by = ?
           WHERE id = ?`,
          [...values, SEED_OWNER, existing.id]
        );
        updated += result.affectedRows || 0;
      }

      if (inserts.length) {
        const placeholders = inserts.map(() => '(?, \'tech_question\', ?, ?, ?, ?, ?, ?, 1, ?)').join(', ');
        const params = inserts.flatMap(([targetLearningId, title, prompt, level, content, sampleSolution, tags]) => [
          targetLearningId,
          title,
          prompt,
          level,
          content,
          sampleSolution,
          tags,
          SEED_OWNER,
        ]);
        const [result] = await db.execute(
          `INSERT INTO learning_item
           (learning_id, type, title, prompt, level, content, sample_solution, tags, is_active, created_by)
           VALUES ${placeholders}`,
          params
        );
        created += result.affectedRows || 0;
      }
    }
    await db.commit();
    return { ok: true, created, updated, skipped, total: created + updated + skipped };
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    console.log(JSON.stringify(await seedTechLearning(db)));
  } finally {
    await db.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  SEED_OWNER,
  banks,
  levels,
  buildSeedItems,
  seedTechLearning,
};
