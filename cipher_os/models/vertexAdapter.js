// cipher_os/models/vertexAdapter.js
import { VertexAI } from "@google-cloud/vertexai";

let vertex = null;

function getCreds() {
  if (process.env.VERTEX_JSON_B64) {
    const raw = Buffer.from(
      process.env.VERTEX_JSON_B64,
      "base64"
    ).toString("utf8");
    return JSON.parse(raw);
  }

  throw new Error("VERTEX_JSON_B64 env var missing");
}

function getVertex() {
  if (vertex) return vertex;

  const creds = getCreds();

  vertex = new VertexAI({
    project: creds.project_id,
    location: process.env.VERTEX_LOCATION || "us-central1",
    credentials: creds,
  });

  return vertex;
}

function extractGeminiText(response) {
  const candidates = response?.candidates;
  if (!Array.isArray(candidates) || !candidates.length) return null;

  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;

  let text = "";
  for (const p of parts) {
    if (typeof p.text === "string") {
      text += p.text;
    }
  }

  return text.trim() || null;
}

export async function vertexGenerate({
  systemPrompt = "",
  messages = [],
  userMessage,
  temperature = 0.6,
}) {
  console.log("🔥 VERTEX GENERATE CALLED");

  const client = getVertex();
  const modelName = process.env.VERTEX_MODEL || "gemini-1.5-flash";

  const model = client.getGenerativeModel({ model: modelName });

  const fullPrompt = [
    systemPrompt && `SYSTEM: ${systemPrompt}`,
    ...messages.map(m => `${m.role.toUpperCase()}: ${m.content}`),
    `USER: ${userMessage}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: fullPrompt }],
      },
    ],
    generationConfig: { temperature },
  });

  const text = extractGeminiText(result?.response);

  if (!text) {
    console.error("❌ Gemini returned no text");
    console.error(
      "🔍 Raw response:",
      JSON.stringify(result?.response, null, 2).slice(0, 2000)
    );
    throw new Error("Gemini returned empty response");
  }

  return {
    reply: text,
    modelUsed: modelName,
  };
}
