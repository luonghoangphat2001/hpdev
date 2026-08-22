'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const createRepositories = require('../src/config/application/repositories');
const OpenAI = require('openai');
const AIService = require('../src/services/ai/AIService');
const LearningService = require('../src/services/learning/LearningService');

const CREATED_BY = 'seed-english-reading-writing-200';
const LEVELS = [
  { value: 'beginner', cefr: 'A1-A2', label: 'Beginner' },
  { value: 'junior', cefr: 'B1', label: 'Junior' },
  { value: 'intermediate', cefr: 'B2', label: 'Intermediate' },
  { value: 'advanced', cefr: 'C1', label: 'Senior' },
];
const MODULES = {
  reading: { slug: 'english-reading', name: 'Reading Comprehension' },
  writing: { slug: 'english-writing', name: 'Writing Studio' },
};

function option(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : fallback;
}

function selectedModules(value = option('modules', 'reading,writing')) {
  const types = String(value).split(',').map((item) => item.trim()).filter(Boolean);
  if (!types.length || types.some((type) => !MODULES[type])) {
    throw new Error('--modules only accepts reading, writing, or reading,writing');
  }
  return [...new Set(types)];
}

function validItem(item, type) {
  if (!item || !String(item.title || '').trim() || !String(item.prompt || '').trim()) return false;
  const content = item.content || {};
  const solution = item.sample_solution || {};
  if (type === 'reading') {
    return Array.isArray(content.key_vocabulary)
      && content.key_vocabulary.length >= 5
      && Array.isArray(content.questions)
      && content.questions.length >= 4
      && content.questions.every((q) => q && q.question && Array.isArray(q.options) && q.correct_answer)
      && Boolean(solution.model_answer);
  }
  return Boolean(content.task_type)
    && Array.isArray(content.key_vocabulary)
    && content.key_vocabulary.length >= 5
    && Boolean(content.suggested_outline)
    && Boolean(solution.model_answer);
}

function itemShape(item) {
  return {
    title: Boolean(String(item?.title || '').trim()),
    promptWords: String(item?.prompt || '').trim().split(/\s+/).filter(Boolean).length,
    vocabulary: Array.isArray(item?.content?.key_vocabulary) ? item.content.key_vocabulary.length : 0,
    questions: Array.isArray(item?.content?.questions) ? item.content.questions.length : 0,
    modelAnswer: Boolean(item?.sample_solution?.model_answer),
    taskType: Boolean(item?.content?.task_type),
    outline: Boolean(item?.content?.suggested_outline),
  };
}

function generationPrompt(type, level, existingTitles) {
  const skill = type === 'reading' ? 'reading comprehension' : 'writing';
  const exclusions = existingTitles.slice(-60).join(' | ') || '(none)';
  const validation = type === 'reading'
    ? 'VALIDATION GATE: prompt must contain 250-400 words in Paragraphs A-D; include 5-8 key_vocabulary entries and exactly 4 concise questions with all required fields. Any shorter or incomplete item will be discarded. '
    : 'VALIDATION GATE: include every Writing schema field, a complete 280-330 word model_answer, at least 5 key_vocabulary entries, outline and examiner notes. ';
  return `${validation}Create distinct ${skill} material calibrated to ${level.label} (${level.cefr}) learners. `
    + `Cover varied education, work, technology, society, health, culture, science and environment contexts. `
    + `Keep options and explanations concise while preserving the source schema and every answer field. Do not repeat these titles: ${exclusions}`;
}

async function seedModule({ type, targetPerLevel, batchSize, model, repositories, learningService }) {
  const definition = MODULES[type];
  const learning = await repositories.learningRepo.findLearningBySlug(definition.slug);
  if (!learning) throw new Error(`Learning module not found: ${definition.slug}`);
  await repositories.learningRepo.updateLearning(learning.id, { name: definition.name, isActive: true });

  const summary = { type, learningId: learning.id, created: 0, levels: [] };
  for (const level of LEVELS) {
    let rows = await repositories.learningRepo.findItems({
      learningId: learning.id,
      type,
      level: level.value,
      includeInactive: true,
      limit: 1000,
    });
    const titles = new Set(rows.map((row) => String(row.title).trim().toLowerCase()));
    let activeCount = rows.filter((row) => Number(row.is_active) !== 0).length;
    let attempts = 0;
    let created = 0;
    const maxAttempts = Math.max(12, targetPerLevel * 3);

    while (activeCount < targetPerLevel && attempts < maxAttempts) {
      attempts++;
      const needed = Math.min(batchSize, targetPerLevel - activeCount);
      console.log(`[English seed] ${definition.name} ${level.label}/${level.cefr}: ${activeCount}/${targetPerLevel}; generating ${needed}`);
      let generated;
      try {
        generated = await learningService.generateContent({
          category: 'english',
          type,
          learning: definition.slug,
          level: level.value,
          count: needed,
          prompt: generationPrompt(type, level, [...titles]),
          model: model || undefined,
        });
      } catch (error) {
        console.error(`[English seed] generation failed (${type}/${level.value}, attempt ${attempts}): ${error.message}`);
        continue;
      }

      for (const item of generated.items || []) {
        const key = String(item.title || '').trim().toLowerCase();
        if (!key || titles.has(key)) continue;
        if (!validItem(item, type)) {
          console.error(`[English seed] rejected invalid ${type} item: ${JSON.stringify(itemShape(item))}`);
          continue;
        }
        await repositories.learningRepo.createItem({
          learningId: learning.id,
          type,
          title: item.title,
          prompt: item.prompt,
          level: level.value,
          content: item.content,
          sampleSolution: item.sample_solution,
          tags: [item.tags, level.cefr, CREATED_BY].filter(Boolean).join(', '),
          createdBy: CREATED_BY,
        });
        titles.add(key);
        activeCount++;
        created++;
        if (activeCount >= targetPerLevel) break;
      }
    }

    summary.created += created;
    summary.levels.push({ level: level.value, cefr: level.cefr, count: activeCount, created, attempts });
  }
  summary.complete = summary.levels.every((row) => row.count >= targetPerLevel);
  return summary;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const target = Math.max(4, Math.min(Number(option('target', '100')), 1000));
  const targetPerLevel = Math.ceil(target / LEVELS.length);
  const batchSize = Math.max(1, Math.min(Number(option('batch', '2')), 3));
  const modules = selectedModules();
  const model = option('model', '');
  const provider = option('provider', 'nvidia');

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, modules, target, targetPerLevel, batchSize, provider, model, levels: LEVELS }, null, 2));
    return;
  }

  const repositories = await createRepositories();
  // The user requested the canonical prompts committed in LearningService.
  // Ignore older, shorter DB overrides for this one-off curriculum seed.
  const configGet = repositories.configRepo.get.bind(repositories.configRepo);
  repositories.configRepo.get = (key) => (
    ['learning_prompt_reading', 'learning_prompt_writing', 'learning_prompt_rw'].includes(key)
      ? ''
      : configGet(key)
  );
  let aiService;
  if (provider === 'nvidia') {
    if (!process.env.NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY is required');
    const directModel = model || process.env.NVIDIA_LEARNING_MODEL || 'meta/llama-3.1-8b-instruct';
    const client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    });
    aiService = {
      chatOnce: async (messages) => {
        const response = await client.chat.completions.create({
          model: directModel,
          max_tokens: 4096,
          temperature: 0.45,
          messages: [
            { role: 'system', content: 'Follow the supplied source prompt exactly. Return only the requested valid JSON array.' },
            ...messages,
          ],
        });
        return response.choices[0].message.content;
      },
    };
  } else {
    aiService = new AIService(repositories.configRepo, repositories.conversationRepo);
  }
  const learningService = new LearningService(repositories.learningRepo, aiService, repositories.configRepo);
  const summary = [];
  for (const type of modules) {
    summary.push(await seedModule({ type, targetPerLevel, batchSize, model, repositories, learningService }));
  }
  const ok = summary.every((row) => row.complete);
  console.log(JSON.stringify({ ok, targetPerModule: targetPerLevel * LEVELS.length, summary }, null, 2));
  process.exit(ok ? 0 : 2);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

module.exports = { CREATED_BY, LEVELS, MODULES, selectedModules, validItem, generationPrompt, seedModule };
