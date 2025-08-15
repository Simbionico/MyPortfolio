// scripts/build-embeddings.ts
import "dotenv/config";
import fs from "fs";
import path from "path";
import { glob } from "glob";
import matter from "gray-matter";
import OpenAI from "openai";

/** ====== Config por ENV (con valores por defecto) ====== */
const KNOWLEDGE_DIR = path.resolve(process.env.KNOWLEDGE_DIR || "knowledge");
const OUT_FILE = path.resolve(process.env.OUT_FILE || "ai/index.json");

const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || 1000);
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP || 200);
const MAX_TEXT_LENGTH = Number(process.env.MAX_TEXT_LENGTH || 100_000); // ~100 KB
const MAX_CHUNKS_PER_FILE = Number(process.env.MAX_CHUNKS_PER_FILE || 200);
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 5);
const BATCH_DELAY_MS = Number(process.env.BATCH_DELAY_MS || 100); // pausita entre lotes
const SAVE_EVERY_N_RECORDS = Number(process.env.SAVE_EVERY_N_RECORDS || 50); // flush incremental

// 🛡️ LÍMITES DE COSTO
const MAX_COST_USD = Number(process.env.MAX_COST_USD || 20); // Límite en dólares
const EMBEDDING_COST_PER_1K_TOKENS = 0.00002; // text-embedding-3-small cost
const CHARS_PER_TOKEN = 4; // Aproximación para español

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Falta OPENAI_API_KEY en el .env");
  process.exit(1);
}

function logMem(prefix = "MEM") {
  const m = process.memoryUsage();
  const mb = (n: number) => (n / (1024 * 1024)).toFixed(1) + " MB";
  console.log(
    `${prefix}: rss=${mb(m.rss)} heapUsed=${mb(m.heapUsed)} heapTotal=${mb(
      m.heapTotal,
    )} ext=${mb(m.external)}`,
  );
}

/** ====== Utilidades ====== */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// 🧮 Calcular costo estimado
function calculateCost(texts: string[]): number {
  const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
  const estimatedTokens = totalChars / CHARS_PER_TOKEN;
  return (estimatedTokens / 1000) * EMBEDDING_COST_PER_1K_TOKENS;
}

// 🛡️ Verificar límite de costo
let accumulatedCost = 0;
function checkCostLimit(newCost: number): boolean {
  const totalCost = accumulatedCost + newCost;
  if (totalCost > MAX_COST_USD) {
    console.error(`❌ LÍMITE DE COSTO EXCEDIDO:`);
    console.error(`   Costo acumulado: $${accumulatedCost.toFixed(4)}`);
    console.error(`   Nuevo costo: $${newCost.toFixed(4)}`);
    console.error(`   Total: $${totalCost.toFixed(4)} > $${MAX_COST_USD}`);
    console.error(`🛑 Proceso detenido para evitar costos excesivos.`);
    return false;
  }
  accumulatedCost = totalCost;
  return true;
}

// chunking por caracteres con overlap + límites
function chunk(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks: string[] = [];
  let src = text;

  // Limitar tamaño por archivo para evitar memoria excesiva
  if (src.length > MAX_TEXT_LENGTH) {
    src = src.slice(0, MAX_TEXT_LENGTH);
    console.log(`  ⚠️ Texto truncado a ${MAX_TEXT_LENGTH} chars`);
  }

  let i = 0;
  while (i < src.length && chunks.length < MAX_CHUNKS_PER_FILE) {
    const end = Math.min(i + size, src.length);
    const piece = src.slice(i, end).trim();
    if (piece) chunks.push(piece);
    const next = end - overlap;
    if (next <= i) break;
    i = next;
  }
  return chunks;
}

async function embedBatch(texts: string[]) {
  // 🛡️ Verificar costo antes de procesar
  const estimatedCost = calculateCost(texts);
  if (!checkCostLimit(estimatedCost)) {
    throw new Error("Límite de costo excedido");
  }

  console.log(
    `    💰 Costo estimado: $${estimatedCost.toFixed(4)} (Total: $${accumulatedCost.toFixed(4)}/$${MAX_COST_USD})`,
  );

  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding as number[]);
}

async function embedInBatches(texts: string[], batchSize = BATCH_SIZE) {
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(
      `    🔹 Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        texts.length / batchSize,
      )} (${batch.length} items)`,
    );
    const embs = await embedBatch(batch);
    results.push(...embs);
    await sleep(BATCH_DELAY_MS);
  }
  return results;
}

function safeWriteIndex(records: any[]) {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({ createdAt: Date.now(), records }, null, 2),
  );
}

/** ====== Main ====== */
(async () => {
  try {
    console.log("🚀 Build embeddings");
    console.log(`📂 knowledge: ${KNOWLEDGE_DIR}`);
    console.log(`📝 output: ${OUT_FILE}`);
    console.log(`💰 Límite de costo: $${MAX_COST_USD}`);
    logMem("INIT");

    const patterns = ["**/*.md", "**/*.mdx", "**/*.txt", "**/*.json"];
    const files = await glob(patterns, { cwd: KNOWLEDGE_DIR, nodir: true });

    if (files.length === 0) {
      console.warn("⚠️ No se encontraron archivos en 'knowledge'.");
      process.exit(0);
    }

    // 🧮 ESTIMACIÓN PREVIA DE COSTO TOTAL
    console.log("\n🧮 Estimando costo total...");
    let totalEstimatedChars = 0;
    let totalEstimatedChunks = 0;

    for (const rel of files) {
      const abs = path.join(KNOWLEDGE_DIR, rel);
      const raw = fs.readFileSync(abs, "utf8");
      let content = raw;
      if (rel.endsWith(".md") || rel.endsWith(".mdx")) {
        const { content: md } = matter(raw);
        content = md;
      }

      const limitedContent =
        content.length > MAX_TEXT_LENGTH
          ? content.slice(0, MAX_TEXT_LENGTH)
          : content;

      const chunks = chunk(limitedContent);
      const charsInFile = chunks.reduce((sum, c) => sum + c.length, 0);

      totalEstimatedChars += charsInFile;
      totalEstimatedChunks += chunks.length;

      console.log(
        `  📄 ${rel}: ${chunks.length} chunks, ~${charsInFile} chars`,
      );
    }

    const estimatedTotalCost =
      (totalEstimatedChars / CHARS_PER_TOKEN / 1000) *
      EMBEDDING_COST_PER_1K_TOKENS;
    console.log(`\n💰 ESTIMACIÓN TOTAL:`);
    console.log(`   📊 Archivos: ${files.length}`);
    console.log(`   📊 Chunks: ${totalEstimatedChunks}`);
    console.log(`   📊 Caracteres: ${totalEstimatedChars.toLocaleString()}`);
    console.log(
      `   📊 Tokens estimados: ${Math.ceil(totalEstimatedChars / CHARS_PER_TOKEN).toLocaleString()}`,
    );
    console.log(`   💰 Costo estimado: $${estimatedTotalCost.toFixed(4)}`);

    if (estimatedTotalCost > MAX_COST_USD) {
      console.error(
        `❌ COSTO ESTIMADO EXCEDE EL LÍMITE: $${estimatedTotalCost.toFixed(4)} > $${MAX_COST_USD}`,
      );
      console.error(`🛑 Reduce el contenido o aumenta MAX_COST_USD en el .env`);
      process.exit(1);
    }

    console.log(`✅ Costo dentro del límite. Continuando...\n`);

    const records: {
      id: string;
      source: string;
      text: string;
      embedding: number[];
    }[] = [];

    let processed = 0;
    for (const rel of files) {
      console.log(`📄 Archivo: ${rel}`);
      const abs = path.join(KNOWLEDGE_DIR, rel);
      const raw = fs.readFileSync(abs, "utf8");

      let content = raw;
      if (rel.endsWith(".md") || rel.endsWith(".mdx")) {
        const { content: md } = matter(raw);
        content = md;
      }

      const pieces = chunk(content);
      console.log(`  ├─ Chunks: ${pieces.length}`);

      const embs = await embedInBatches(pieces, BATCH_SIZE);

      pieces.forEach((piece, i) => {
        records.push({
          id: `${rel}#${i}`,
          source: rel,
          text: piece,
          embedding: embs[i],
        });
      });

      console.log(`  └─ Acumulados: ${records.length}`);
      processed++;

      // Guardado incremental para no perder progreso
      if (records.length % SAVE_EVERY_N_RECORDS === 0) {
        safeWriteIndex(records);
        logMem("FLUSH");
        // Sugerir GC si se ejecuta con --expose-gc
        // @ts-ignore
        global.gc?.();
      }
    }

    // Guardado final
    safeWriteIndex(records);
    logMem("DONE");

    console.log(
      `✅ Listo. ${processed} archivos, ${records.length} chunks guardados en ${OUT_FILE}`,
    );
    console.log(
      `💰 Costo total: $${accumulatedCost.toFixed(4)} de $${MAX_COST_USD} permitidos`,
    );
    console.log(
      `💡 Ahorro: $${(MAX_COST_USD - accumulatedCost).toFixed(4)} restantes`,
    );
  } catch (err: any) {
    console.error("❌ Error:", err?.message || err);
    if (accumulatedCost > 0) {
      console.log(`💰 Costo parcial: $${accumulatedCost.toFixed(4)}`);
    }
    process.exit(1);
  }
})();
