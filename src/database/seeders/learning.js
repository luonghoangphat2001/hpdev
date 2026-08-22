'use strict';

/**
 * Seed default learning categories, stacks and English modules.
 * @param {import('../../models/Database')} db
 */
module.exports = async function run(db) {
    // 1. Seed Categories
    await db.query(`
      INSERT IGNORE INTO learning_category (id, slug, name, icon, description, sort_order)
      VALUES 
        (1, 'tech', 'Tech', '💻', 'Kỹ thuật & Phỏng vấn cho 6 Tech Stacks hàng đầu', 1),
        (2, 'english', 'English', '🇬🇧', 'Tiếng Anh toàn diện: Từ vựng, Trắc nghiệm, Đọc Viết, Luyện Nói, IELTS', 2)
    `);

    // 2. Seed Tech Stacks under Category 1 (tech)
    const techStacks = [
      { slug: 'php',        name: 'PHP',        icon: '🐘', desc: 'Core PHP 8+, OOP, PDO, Security & Web Patterns', sort: 1 },
      { slug: 'nextjs',     name: 'Next.js',    icon: '▲',  desc: 'App Router, RSC, Caching, Server Actions & SEO', sort: 2 },
      { slug: 'python',     name: 'Python',     icon: '🐍', desc: 'Asyncio, GIL, OOP & Metaclasses, FastAPI & Memory', sort: 3 },
      { slug: 'reactjs',    name: 'React.js',   icon: '⚛️', desc: 'Virtual DOM, Fiber, Hooks, State & React 19', sort: 4 },
      { slug: 'javascript', name: 'JavaScript', icon: '🟨', desc: 'Event Loop, Engine V8, Closures, Prototypes & ES6+', sort: 5 },
      { slug: 'nodejs',     name: 'Node.js',    icon: '🟩', desc: 'Libuv, Streams, Worker Threads & Microservices', sort: 6 },
    ];

    for (const s of techStacks) {
      await db.query(`
        INSERT IGNORE INTO learning (category_id, type, slug, name, icon, description, sort_order)
        VALUES (1, 'tech_question', ?, ?, ?, ?, ?)
      `, [s.slug, s.name, s.icon, s.desc, s.sort]);
    }

    // 3. Seed English Modules under Category 2 (english)
    // 3a. 50 Vocabulary Topics
    for (let i = 1; i <= 50; i++) {
      await db.query(`
        INSERT IGNORE INTO learning (category_id, type, slug, name, icon, description, topic_no, sort_order)
        VALUES (2, 'vocabulary', ?, ?, '📖', ?, ?, ?)
      `, [`vocab-topic-${i}`, `Topic ${i}`, `Chủ đề từ vựng ${i}`, i, i]);
    }

    // 3b. Skills modules
    const englishSkills = [
      { slug: 'english-quiz',     name: 'Quiz & Practice',     icon: '🧩', type: 'quiz',     desc: 'Trắc nghiệm từ vựng & ngữ pháp' },
      { slug: 'english-reading',  name: 'Reading Practice',   icon: '📖', type: 'reading',  desc: 'Đọc hiểu & phân tích bài đọc tiếng Anh' },
      { slug: 'english-writing',  name: 'Writing Studio',      icon: '✍️', type: 'writing',  desc: 'Luyện viết đoạn văn, email, bài luận & báo cáo' },
      { slug: 'english-speaking', name: 'Speaking Practice',   icon: '🗣️', type: 'speaking', desc: 'Phản xạ giao tiếp & phỏng vấn' },
      { slug: 'english-ielts',    name: 'IELTS Prep (0-9.0)',  icon: '🎯', type: 'ielts',    desc: 'Luyện thi IELTS 4 kỹ năng' },
    ];

    for (const sk of englishSkills) {
      await db.query(`
        INSERT IGNORE INTO learning (category_id, type, slug, name, icon, description, sort_order)
        VALUES (2, ?, ?, ?, ?, ?, 60)
      `, [sk.type, sk.slug, sk.name, sk.icon, sk.desc]);
    }


};

