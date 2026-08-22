'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const createRepositories = require('../src/config/application/repositories');
const { parseJson } = require('../src/services/learning/ContentNormalizer');
const OpenAI = require('openai');

const DICTIONARY_URL = process.env.VOCAB_DICTIONARY_API_URL
  || 'https://api.dictionaryapi.dev/api/v2/entries/en';
const CLOUDFLARE_BASE_URL = (process.env.CLOUDFLARE_BASE_URL
  || `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}`).replace(/\/$/, '');
const CLOUDFLARE_MODEL = process.env.CLOUDFLARE_VOCAB_MODEL
  || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

function normalizeIpa(value) {
  const ipa = String(value || '').replace(/\s+/g, ' ').trim();
  if (!ipa || ipa.length > 160) return '';
  return ipa.startsWith('/') && ipa.endsWith('/') ? ipa : `/${ipa.replace(/^\/+|\/+$/g, '')}/`;
}

async function dictionaryIpa(word) {
  try {
    const response = await fetch(`${DICTIONARY_URL}/${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return '';
    const entries = await response.json();
    for (const entry of Array.isArray(entries) ? entries : []) {
      const phonetic = entry.phonetic || entry.phonetics?.find((item) => item.text)?.text;
      if (phonetic) return normalizeIpa(phonetic);
    }
  } catch (_) {}
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

async function generateIpaBatch(rows) {
  const input = rows.map((row) => ({ id: row.id, word: row.word }));
  const messages = [
    { role: 'system', content: 'You are an expert English phonetician. Return accurate standard British IPA and valid JSON only.' },
    { role: 'user', content: `Add pronunciation for every item. Preserve each id. For multiword expressions, transcribe the complete phrase. Return {"items":[{"id":1,"pronunciation":"/.../"}]}. Input: ${JSON.stringify(input)}` },
  ];
  let text = '';
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) {
    const response = await fetch(`${CLOUDFLARE_BASE_URL}/ai/run/${CLOUDFLARE_MODEL}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_tokens: 4096, temperature: 0.1 }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.success !== false) {
      text = body.result?.response || body.result?.choices?.[0]?.message?.content || '';
    }
  }
  if (!text) {
    if (!process.env.NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY is required for IPA fallback');
    const client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    });
    const response = await client.chat.completions.create({
      model: process.env.NVIDIA_IPA_MODEL || 'meta/llama-3.1-8b-instruct',
      max_tokens: 4096,
      temperature: 0.1,
      messages,
    });
    text = response.choices[0].message.content || '';
  }
  const parsed = parseJson(text);
  return (parsed?.items || []).map((item) => ({ id: Number(item.id), pronunciation: normalizeIpa(item.pronunciation) }))
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
  if (missing.length && !process.env.NVIDIA_API_KEY
    && (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)) {
    throw new Error(`An AI provider is required for ${missing.length} remaining phrases`);
  }

  let generated = 0;
  for (let index = 0; index < missing.length; index += 30) {
    const updates = await generateIpaBatch(missing.slice(index, index + 30));
    await vocabRepo.updatePronunciationsBatch(updates);
    generated += updates.length;
    console.log(`[IPA] Generated: ${generated}/${missing.length}`);
  }

  const remaining = await vocabRepo.findMissingPronunciationWords();
  console.log(JSON.stringify({ ok: remaining.length === 0, dictionary: dictionaryUpdates.length, generated, remaining: remaining.length }));
  process.exit(remaining.length === 0 ? 0 : 2);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
