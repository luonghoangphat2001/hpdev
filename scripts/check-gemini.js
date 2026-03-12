require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function main() {
  console.log("🔍 Listing available Gemini models...\n");

  const { models } = await genAI.listModels();

  for (const model of models) {
    const supportChat = model.supportedGenerationMethods?.includes("generateContent");
    if (supportChat) {
      console.log(`✅ ${model.name}`);
      console.log(`   Display: ${model.displayName}`);
      console.log(`   Input tokens: ${model.inputTokenLimit}`);
      console.log(`   Output tokens: ${model.outputTokenLimit}`);
      console.log();
    }
  }
}

main().catch(console.error);
