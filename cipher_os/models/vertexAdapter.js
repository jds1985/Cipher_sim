// cipher_os/models/vertexAdapter.js
import { VertexAI } from "@google-cloud/vertexai";

let vertex = null;

function getCreds() {
  if (!process.env.VERTEX_JSON_B64) {
    throw new Error("VERTEX_JSON_B64 env var missing");
  }

  const raw = Buffer.from(
    process.env.VERTEX_JSON_B64,
    "base64"
  ).toString("utf8");

  return JSON.parse(raw);
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

export async function vertexGenerate({
  systemPrompt = "",
  messages = [],
  userMessage,
  temperature = 0.6,
}) {
  console.log("🔥 VERTEX GENERATE CALLED");

  const client = getVertex();
  const modelName = process.env.VERTEX_MODEL || "gemini-1.5-flash";

  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature,
    },
  });

  // ✅ Gemini-safe prompt (single string, no roles)
  const prompt = [
    systemPrompt && `SYSTEM:\n${systemPrompt}`,
    ...messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`),
    `USER:\n${userMessage}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err) {
    console.error("❌ Vertex API error:", err);
    throw err;
  }

  const text =
    result?.response?.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      .join("")
      ?.trim();

  if (!text) {
    console.error("❌ Gemini returned empty response");
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
