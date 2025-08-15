// netlify/functions/chat.ts
import type { Handler } from "@netlify/functions";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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
  // Headers CORS
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Manejar preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const { message } = JSON.parse(event.body || "{}") as { message?: string };
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing 'message'" }),
      };
    }

    // Verificar API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          answer: "Error de configuración. Contacta a charlie.cs93@gmail.com",
          sources: [],
        }),
      };
    }

    // Verificar archivo de embeddings
    const INDEX_PATH = path.resolve("ai/index.json");
    if (!fs.existsSync(INDEX_PATH)) {
      console.error("Embeddings file not found:", INDEX_PATH);
      console.error("Current working directory:", process.cwd());
      console.error(
        "Files in current dir:",
        fs
          .readdirSync(".")
          .filter((f) => f.includes("ai") || f.includes("index")),
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          answer:
            "Hola! Soy Carlos Castellanos, desarrollador full stack con más de 8 años de experiencia en .NET Core, Python, AWS y automatización. ¿En qué te puedo ayudar?",
          sources: [],
        }),
      };
    }
    console.info("Embeddings file found:", INDEX_PATH);

    // 1) embed del query
    console.log("Generating embedding for:", message);
    const qEmb = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    });
    const qVec = qEmb.data[0].embedding;

    // 2) cargar índice y rankear
    console.log("Loading embeddings index...");
    const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8")) as {
      records: {
        id: string;
        source: string;
        text: string;
        embedding: number[];
      }[];
    };

    console.log(`Found ${index.records.length} records in index`);

    const scored = index.records
      .map((r) => ({ ...r, score: cosine(qVec, r.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Aumentamos de 6 a 8 para más contexto

    console.log(
      `Top scores:`,
      scored.slice(0, 3).map((s) => s.score),
    );

    // 3) armar contexto
    const context = scored
      .map((s, i) => `### Fragmento ${i + 1} (src: ${s.source})\n${s.text}`)
      .join("\n\n");

    // 4) prompt con reglas
    const system = `
Eres Carlos Castellanos, desarrollador full stack con más de 8 años de experiencia.

INSTRUCCIONES IMPORTANTES:
- Responde SIEMPRE en español, de manera conversacional y amigable
- Usa ÚNICAMENTE la información del CONTEXTO proporcionado
- Incluye nombres específicos, fechas, tecnologías y detalles exactos cuando estén disponibles
- Si mencionas empresas, proyectos o tecnologías, usa los nombres exactos del contexto
- Habla en primera persona como si fueras Carlos
- Si algo no está en el contexto, di: "No tengo ese dato específico aquí, pero puedes contactarme en charlie.cs93@gmail.com para más detalles"

EJEMPLOS de respuestas con detalles específicos:
- Si preguntan por empresas, menciona el nombre exacto como "Krom Aduanal"
- Si preguntan por tecnologías, menciona versiones específicas como ".NET Core 6"
- Si preguntan por proyectos, usa los nombres exactos como "SmileToFit" o "Sistema Aduanal"
    `.trim();

    const user = `
Pregunta: ${message}

CONTEXTO:
${context}
    `.trim();

    // 5) llamada al modelo
    console.log("Calling OpenAI completion...");
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const answer =
      completion.choices[0]?.message?.content ?? "No pude generar respuesta.";

    console.log("Generated answer:", answer.substring(0, 100) + "...");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        answer,
        sources: scored.slice(0, 3).map((s) => ({
          id: s.id,
          source: s.source,
          score: Number(s.score.toFixed(3)),
        })),
      }),
    };
  } catch (e: any) {
    console.error("Error in chat function:", e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        answer:
          "Disculpa, hubo un error técnico. Soy Carlos Castellanos, desarrollador full stack. Puedes contactarme en charlie.cs93@gmail.com",
        sources: [],
      }),
    };
  }
};
