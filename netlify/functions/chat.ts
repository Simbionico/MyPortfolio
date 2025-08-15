// netlify/functions/chat.ts
import type { Handler } from "@netlify/functions";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import "dotenv/config";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const INDEX_PATH = path.resolve("ai/index.json");

// coseno entre dos vectores
function cosine(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { message } = JSON.parse(event.body || "{}") as { message?: string };
    if (!message) {
      return { statusCode: 400, body: "Missing 'message'" };
    }

    // 1) embed del query
    const qEmb = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    });
    const qVec = qEmb.data[0].embedding;

    // 2) cargar índice y rankear
    const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8")) as {
      records: {
        id: string;
        source: string;
        text: string;
        embedding: number[];
      }[];
    };

    const scored = index.records
      .map((r) => ({ ...r, score: cosine(qVec, r.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // 3) armar contexto
    const context = scored
      .map((s, i) => `### Fragmento ${i + 1} (src: ${s.source})\n${s.text}`)
      .join("\n\n");

    // 4) prompt con reglas
    const system = `
Eres el asistente del portafolio de Carlos Castellanos.
Responde SIEMPRE en español, breve y directo.
Usa SOLO la información del CONTEXTO. 
Si algo no está en el contexto, di: "No tengo ese dato aquí, pero puedes contactarme en charlie.cs93@gmail.com".
Cuando te pidan links del sitio, responde con rutas relativas si aplican.
    `.trim();

    const user = `
Pregunta: ${message}

CONTEXTO:
${context}
    `.trim();

    // 5) llamada al modelo
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const answer =
      completion.choices[0]?.message?.content ?? "No pude generar respuesta.";
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        answer,
        sources: scored.map((s) => ({
          id: s.id,
          source: s.source,
          score: Number(s.score.toFixed(3)),
        })),
      }),
    };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, body: "Server error" };
  }
};
