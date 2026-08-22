require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const key = process.env.GEMINI_KEY;
if (!key) { console.error("GEMINI_KEY not set"); process.exit(1); }

async function main() {
  console.log("🔍 Listing available Gemini models...\n");

  const baseUrl = process.env.GEMINI_API_BASE_URL;
  if (!baseUrl) {
    console.error("GEMINI_API_BASE_URL not set");
    process.exit(1);
  }
  const res = await fetch(
    `${baseUrl.replace(/\/$/, "")}/v1beta/models?key=${key}`
  );
  const data = await res.json();

  if (!res.ok) {
    console.error("API Error:", data);
    return;
  }

  for (const model of data.models || []) {
    const supportChat = model.supportedGenerationMethods?.includes("generateContent");
    if (!supportChat) continue;
    console.log(`✅ ${model.name}`);
    console.log(`   Display    : ${model.displayName}`);
    console.log(`   Input limit: ${model.inputTokenLimit} tokens`);
    console.log(`   Output limit: ${model.outputTokenLimit} tokens`);
    console.log();
  }
}

main().catch(console.error);
