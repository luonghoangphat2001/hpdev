'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('module-alias/register');

const createRepositories = require('@bootstrap/repositories');
const { parseJson } = require('@services/learning/ContentNormalizer');
const AIFactory = require('@services/ai/AIFactory');

function requireEnv(key) {
  const val = process.env[key];
  if (!val || String(val).trim().length === 0) {
    throw new Error(`[Env] Missing required environment variable: ${key}`);
  }
  return String(val).trim();
}

function normalizeIpa(value) {
  if (!value) return '';
  const ipa = String(value).replace(/\s+/g, ' ').trim();
  if (ipa.length === 0 || ipa.length > 160) return '';
  if (ipa.startsWith('/') && ipa.endsWith('/')) {
    return ipa;
  }
  return `/${ipa.replace(/^\/+|\/+$/g, '')}/`;
}

async function dictionaryIpa(word) {
  const dictionaryUrl = requireEnv('VOCAB_DICTIONARY_API_URL');
  try {
    const response = await fetch(`${dictionaryUrl}/${encodeURIComponent(word)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return '';
    const entries = await response.json();
    const list = Array.isArray(entries) ? entries : [];
    for (const entry of list) {
      let phonetic = entry.phonetic;
      if (!phonetic && entry.phonetics) {
        const found = entry.phonetics.find((item) => item.text);
        if (found) phonetic = found.text;
      }
      if (phonetic) return normalizeIpa(phonetic);
    }
  } catch (err) {
    console.error(`[DictionaryAPI] Failed for word ${word}:`, err.message);
  }
  return '';
}

async function mapLimit(rows, limit, worker) {
  const results = new Array(rows.length);
  let cursor = 0;
  async function run() {
    while (cursor < rows.length) {
      const index = cursor++;
      results[index] = await worker(rows[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, rows.length) }, run));
  return results;
}

function resolveAiProvider() {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey && nvidiaKey.trim().length > 0) {
    return AIFactory.create('nvidia', {
      nvidiaModel: requireEnv('NVIDIA_IPA_MODEL'),
      nvidiaBaseUrl: requireEnv('NVIDIA_BASE_URL'),
    });
  }

  const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
  const cloudflareAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (cloudflareToken && cloudflareAccount) {
    return AIFactory.create('cloudflare', {
      cloudflareModel: requireEnv('CLOUDFLARE_VOCAB_MODEL'),
      cloudflareBaseUrl: requireEnv('CLOUDFLARE_BASE_URL'),
    });
  }

  return AIFactory.create('gemini');
}

async function generateIpaBatch(rows, aiProvider) {
  const input = rows.map((row) => ({ id: row.id, word: row.word }));
  const systemPrompt = 'You are an expert English phonetician. Return accurate standard British IPA and valid JSON only.';
  const userPrompt = `Add pronunciation for every item. Preserve each id. For multiword expressions, transcribe the complete phrase. Return {"items":[{"id":1,"pronunciation":"/.../"}]}. Input: ${JSON.stringify(input)}`;

  const response = await aiProvider.chat(
    [{ role: 'user', content: userPrompt }],
    systemPrompt,
    { max_tokens: 4096, temperature: 0.1 }
  );

  const parsed = parseJson(response.text);
  const items = parsed?.items ? parsed.items : [];
  return items
    .map((item) => ({ id: Number(item.id), pronunciation: normalizeIpa(item.pronunciation) }))
    .filter((item) => item.id && item.pronunciation);
}

async function main() {
  const { vocabRepo } = await createRepositories();
  let missing = await vocabRepo.findMissingPronunciationWords();
  console.log(`[IPA] Missing before fill: ${missing.length}`);

  const dictionaryResults = await mapLimit(missing, 10, async (row) => ({
    id: row.id,
    pronunciation: await dictionaryIpa(row.word),
  }));
  const dictionaryUpdates = dictionaryResults.filter((row) => row.pronunciation);
  await vocabRepo.updatePronunciationsBatch(dictionaryUpdates);
  console.log(`[IPA] Dictionary filled: ${dictionaryUpdates.length}`);

  missing = await vocabRepo.findMissingPronunciationWords();
  if (missing.length === 0) {
    console.log(JSON.stringify({ ok: true, dictionary: dictionaryUpdates.length, generated: 0, remaining: 0 }));
    process.exit(0);
  }

  const aiProvider = resolveAiProvider();
  let generated = 0;
  for (let index = 0; index < missing.length; index += 30) {
    const updates = await generateIpaBatch(missing.slice(index, index + 30), aiProvider);
    await vocabRepo.updatePronunciationsBatch(updates);
    generated += updates.length;
    console.log(`[IPA] Generated: ${generated}/${missing.length}`);
  }

  const remaining = await vocabRepo.findMissingPronunciationWords();
  console.log(JSON.stringify({ ok: remaining.length === 0, dictionary: dictionaryUpdates.length, generated, remaining: remaining.length }));
  process.exit(remaining.length === 0 ? 0 : 2);
}

main().catch((error) => {
  console.error(error.stack ? error.stack : error.message);
  process.exit(1);
});
