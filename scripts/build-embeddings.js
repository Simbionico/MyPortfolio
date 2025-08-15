// scripts/build-embeddings.js
import fs from "fs";
import path from "path";
import { glob } from "glob";
import matter from "gray-matter";
import OpenAI from "openai";
import "dotenv/config";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const KNOWLEDGE_DIR = path.resolve("knowledge");
const OUT_FILE = path.resolve("ai/index.json");

// chunking simple por caracteres
function chunk(text, size = 1000, overlap = 200) {
  const chunks = [];
  let i = 0;

  // Limitar el texto para evitar problemas de memoria
  const maxTextLength = 100000; // 100KB máximo por archivo
  if (text.length > maxTextLength) {
    text = text.substring(0, maxTextLength);
    console.log(`  ⚠️ Texto truncado a ${maxTextLength} caracteres`);
  }

  while (i < text.length && chunks.length < 200) {
    // Max 200 chunks por archivo
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

// Procesar embeddings en lotes pequeños para evitar memory issues
async function embedBatch(texts, batchSize = 10) {
  const results = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`,
    );
    const embeddings = await embed(batch);
    results.push(...embeddings);
    // Pequeña pausa para evitar rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return results;
}

(async () => {
  try {
    const files = await glob("**/*.{md,mdx,txt,json}", { cwd: KNOWLEDGE_DIR });
    const records = [];

    for (const rel of files) {
      console.log(`📄 Processing: ${rel}`);
      const abs = path.join(KNOWLEDGE_DIR, rel);
      const raw = fs.readFileSync(abs, "utf8");

      let content = raw;
      if (rel.endsWith(".md") || rel.endsWith(".mdx")) {
        const { content: md } = matter(raw);
        content = md;
      }

      const pieces = chunk(content);
      console.log(`  ├── Generated ${pieces.length} chunks`);

      const embs = await embedBatch(pieces, 5); // Procesar 5 chunks a la vez

      pieces.forEach((piece, i) => {
        records.push({
          id: `${rel}#${i}`,
          source: rel,
          text: piece,
          embedding: embs[i],
        });
      });

      console.log(`  └── Added ${pieces.length} records`);
    }

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(
      OUT_FILE,
      JSON.stringify({ createdAt: Date.now(), records }, null, 2),
    );
    console.log(
      `✅ Embeddings guardados en ${OUT_FILE} (${records.length} chunks).`,
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
