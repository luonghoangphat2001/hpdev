'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const createRepositories = require('../src/config/application/repositories');
const { parseJson } = require('../src/services/learning/ContentNormalizer');

const TOPICS = [
  [21, 'Government & Politics'],
  [22, 'Crime & Law'],
  [23, 'Media & Advertising'],
  [24, 'Art & Design'],
  [25, 'Sports & Competition'],
  [26, 'Globalization'],
  [27, 'Urbanization & Cities'],
  [28, 'Housing & Architecture'],
  [29, 'Agriculture & Food Security'],
  [30, 'Energy & Natural Resources'],
  [31, 'Climate Change'],
  [32, 'Wildlife & Biodiversity'],
  [33, 'Space Exploration'],
  [34, 'Medicine & Public Health'],
  [35, 'Psychology & Mental Health'],
  [36, 'Children & Parenting'],
  [37, 'Ageing & Population'],
  [38, 'Gender & Equality'],
  [39, 'Migration & Multiculturalism'],
  [40, 'Poverty & Social Welfare'],
  [41, 'Consumerism'],
  [42, 'Tourism Impacts'],
  [43, 'Language & Linguistics'],
  [44, 'History & Heritage'],
  [45, 'Literature & Reading'],
  [46, 'Music & Performing Arts'],
  [47, 'Internet & Social Media'],
  [48, 'Artificial Intelligence & Automation'],
  [49, 'Research & Innovation'],
  [50, 'Academic Writing & Data Description'],
];

function option(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : fallback;
}

function selectedTopics() {
  const range = String(option('topics', '21-50')).match(/^(\d+)(?:-(\d+))?$/);
  if (!range) throw new Error('--topics must look like 21 or 21-50');
  const start = Number(range[1]);
  const end = Number(range[2] || range[1]);
  if (start < 21 || end > 50 || start > end) throw new Error('--topics must stay within 21-50');
  return TOPICS.filter(([topicNo]) => topicNo >= start && topicNo <= end);
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function validWord(item) {
  const word = clean(item.word || item.title);
  const meaning = clean(item.meaning);
  const pronunciation = clean(item.pronunciation);
  const example = clean(item.example);
  const note = clean(item.note);
  if (!word || !meaning || !pronunciation || !example || !note) return null;
  if (word.length > 100 || meaning.length > 250 || example.length > 500 || note.length > 500) return null;
  return { word, meaning, pronunciation, example, note, isActive: 1 };
}

async function generateBatch(client, { provider, model, topicName, count, existingWords }) {
  const prompt = `Create exactly ${count} unique IELTS vocabulary entries for the topic "${topicName}".

Audience: Vietnamese IELTS learners targeting Band 7.0-9.0. Use genuinely useful B2-C2 academic vocabulary and natural topic-specific collocations. Mix nouns, verbs, adjectives and collocations. Avoid elementary, vague or conversational filler words. Do not repeat any of these entries: ${existingWords.join(', ') || '(none)'}.

Requirements for every entry:
- word: an English headword or established collocation, without numbering
- meaning: concise and accurate Vietnamese meaning in this topic
- pronunciation: standard IPA enclosed in /slashes/
- example: one natural, grammatically correct IELTS-style English sentence of 12-25 words that demonstrates the meaning
- note: a faithful, natural Vietnamese translation of the example

Return JSON only, using exactly this shape:
{"items":[{"word":"...","meaning":"...","pronunciation":"/.../","example":"...","note":"..."}]}`;

  const system = 'You are a Cambridge IELTS vocabulary editor and Vietnamese-English lexicographer. Accuracy and natural usage are mandatory.';
  let text;
  if (provider === 'gemini') {
    const generator = client.getGenerativeModel({
      model,
      systemInstruction: system,
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });
    const response = await generator.generateContent(prompt);
    text = response.response.text();
  } else if (provider === 'cloudflare') {
    const response = await fetch(`${client.baseUrl}/ai/run/${model}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${client.apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.45,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false) {
      const detail = body.errors?.map((error) => error.message || error.code).filter(Boolean).join('; ');
      throw new Error(`Cloudflare ${response.status}: ${detail || response.statusText}`);
    }
    text = body.result?.response || body.result?.choices?.[0]?.message?.content || '';
  } else {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 5000,
      temperature: 0.45,
      ...(provider === 'openai' ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    });
    text = response.choices[0].message.content;
  }

  const parsed = parseJson(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('Provider returned invalid JSON');
  return (Array.isArray(parsed.items) ? parsed.items : []).map(validWord).filter(Boolean);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const target = Math.max(1, Math.min(Number(option('target', '50')), 50));
  const batchSize = Math.max(1, Math.min(Number(option('batch', '10')), 15));
  const provider = option('provider', 'cloudflare');
  if (!['gemini', 'openai', 'nvidia', 'cloudflare'].includes(provider)) throw new Error('--provider must be gemini, openai, nvidia or cloudflare');
  const defaultModel = provider === 'gemini'
    ? (process.env.GEMINI_VOCAB_MODEL || 'gemini-flash-latest')
    : provider === 'cloudflare'
      ? (process.env.CLOUDFLARE_VOCAB_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast')
    : provider === 'nvidia'
      ? (process.env.NVIDIA_VOCAB_MODEL || 'meta/llama-3.3-70b-instruct')
      : (process.env.OPENAI_VOCAB_MODEL || 'gpt-4.1-mini');
  const model = option('model', defaultModel);
  const topics = selectedTopics();

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, target, batchSize, provider, model, topics }, null, 2));
    return;
  }
  if (provider === 'gemini' && !process.env.GEMINI_KEY) throw new Error('GEMINI_KEY is required');
  if (provider === 'openai' && !process.env.OPENAI_KEY) throw new Error('OPENAI_KEY is required');
  if (provider === 'nvidia' && !process.env.NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY is required');
  if (provider === 'cloudflare' && (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)) throw new Error('Cloudflare credentials are required');

  const client = provider === 'gemini'
    ? new GoogleGenerativeAI(process.env.GEMINI_KEY)
    : provider === 'cloudflare'
      ? {
          apiToken: process.env.CLOUDFLARE_API_TOKEN,
          baseUrl: (process.env.CLOUDFLARE_BASE_URL || `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}`).replace(/\/$/, ''),
        }
    : provider === 'nvidia'
      ? new OpenAI({ apiKey: process.env.NVIDIA_API_KEY, baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1' })
      : new OpenAI({ apiKey: process.env.OPENAI_KEY, baseURL: process.env.OPENAI_BASE_URL || undefined });
  const { vocabRepo } = await createRepositories();
  const summary = [];

  for (const [topicNo, topicName] of topics) {
    await vocabRepo.updateTopic(topicNo, { name: topicName, isActive: true, sortOrder: topicNo });
    let words = await vocabRepo.findWords(topicNo, { limit: 500, includeInactive: true });
    let attempts = 0;

    while (words.length < target && attempts < 12) {
      attempts++;
      const needed = Math.min(batchSize, target - words.length);
      const existingWords = words.map((row) => clean(row.word).toLowerCase());
      console.log(`[IELTS vocab] Topic ${topicNo} (${topicName}): ${words.length}/${target}; generating ${needed}`);

      let generated;
      try {
        generated = await generateBatch(client, { provider, model, topicName, count: needed, existingWords });
      } catch (error) {
        console.error(`[IELTS vocab] Topic ${topicNo}, attempt ${attempts} failed: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, Math.min(attempts * 2000, 10000)));
        continue;
      }

      const seen = new Set(existingWords);
      for (const item of generated) {
        const key = item.word.toLowerCase();
        if (seen.has(key)) continue;
        await vocabRepo.upsertWordByTopicAndWord({ ...item, topicNo });
        seen.add(key);
      }
      words = await vocabRepo.findWords(topicNo, { limit: 500, includeInactive: true });
    }

    const completed = words.length >= target;
    summary.push({ topicNo, topicName, wordCount: words.length, completed, attempts });
    console.log(`[IELTS vocab] Topic ${topicNo}: ${completed ? 'complete' : 'incomplete'} (${words.length}/${target})`);
  }

  console.log(JSON.stringify({ ok: summary.every((row) => row.completed), summary }, null, 2));
  process.exit(summary.every((row) => row.completed) ? 0 : 2);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
