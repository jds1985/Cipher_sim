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
  userMessage,
  temperature = 0.6,
}) {
  console.log("🔥 VERTEX GENERATE CALLED");

  const client = getVertex();
  const modelName = process.env.VERTEX_MODEL || "gemini-1.5-flash";

  const model = client.getGenerativeModel({ model: modelName });

  const prompt = `
${systemPrompt || "You are a helpful assistant."}

User:
${userMessage}

Respond clearly in plain text.
`.trim();

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: 512,
    },
  });

  // ✅ THIS IS THE MISSING PIECE
  let text = null;

  try {
    text = await result.response.text();
  } catch (err) {
    console.warn("⚠️ response.text() unavailable, falling back");
  }

  // Fallback if SDK helper fails
  if (!text) {
    const candidates = result?.response?.candidates;
    if (Array.isArray(candidates)) {
      for (const c of candidates) {
        const parts = c?.content?.parts;
        if (!Array.isArray(parts)) continue;

        text = parts
          .map(p => p?.text)
          .filter(Boolean)
          .join("");

        if (text) break;
      }
    }
  }

  if (!text || !text.trim()) {
    console.error("❌ Gemini returned no text");
    console.error(
      "🔍 Raw response:",
      JSON.stringify(result?.response, null, 2).slice(0, 3000)
    );
    throw new Error("Vertex returned no usable response");
  }

  return {
    reply: text.trim(),
    modelUsed: modelName,
  };
}
