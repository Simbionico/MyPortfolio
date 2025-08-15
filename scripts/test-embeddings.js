// scripts/test-embeddings.js - Version de prueba
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import OpenAI from "openai";
import "dotenv/config";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TEST_FILE = "knowledge/about.md"; // Solo procesar este archivo
const OUT_FILE = "ai/test-index.json";

function chunk(text, size = 500, overlap = 100) {
  const chunks = [];
  let i = 0;

  while (i < text.length && chunks.length < 5) {
    // Max 5 chunks para prueba
    const end = Math.min(i + size, text.length);
    const chunkText = text.slice(i, end).trim();
    if (chunkText.length > 0) {
      chunks.push(chunkText);
    }
    i = end - overlap;
    if (i <= 0) break;
  }
  return chunks;
}

async function embed(texts) {
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

(async () => {
  try {
    console.log(`📄 Testing with: ${TEST_FILE}`);

    const raw = fs.readFileSync(TEST_FILE, "utf8");
    const { content } = matter(raw);

    const pieces = chunk(content);
    console.log(`  ├── Generated ${pieces.length} chunks`);

    const embs = await embed(pieces);
    console.log(`  ├── Generated ${embs.length} embeddings`);

    const records = pieces.map((piece, i) => ({
      id: `test#${i}`,
      source: TEST_FILE,
      text: piece,
      embedding: embs[i],
    }));

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(
      OUT_FILE,
      JSON.stringify({ createdAt: Date.now(), records }, null, 2),
    );

    console.log(
      `✅ Test embeddings guardados en ${OUT_FILE} (${records.length} chunks).`,
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("429")) {
      console.log(
        "💡 Verifica tu cuenta de OpenAI: https://platform.openai.com/usage",
      );
    }
    process.exit(1);
  }
})();
