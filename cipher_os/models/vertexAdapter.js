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

function extractGeminiText(response) {
  if (!response) return null;

  // Rare but real case
  if (typeof response.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  const candidates = response.candidates;
  if (!Array.isArray(candidates)) return null;

  for (const c of candidates) {
    const parts = c?.content?.parts;
    if (!Array.isArray(parts)) continue;

    let text = "";
    for (const p of parts) {
      if (typeof p?.text === "string") {
        text += p.text;
      }
    }

    if (text.trim()) return text.trim();
  }

  return null;
}

export async function vertexGenerate({
  systemPrompt = "",
  messages = [], // intentionally ignored for Gemini stability
  userMessage,
  temperature = 0.6,
}) {
  console.log("🔥 VERTEX GENERATE CALLED");

  const client = getVertex();
  const modelName = process.env.VERTEX_MODEL || "gemini-1.5-flash";

  const model = client.getGenerativeModel({ model: modelName });

  // 🚨 CRITICAL FIX:
  // Gemini on Vertex does NOT like role-stacked chat prompts.
  // Single explicit instruction = reliable output.
  const fullPrompt = `
${systemPrompt || "You are a helpful assistant."}

User message:
${userMessage}

Respond with a clear, direct plain-text answer.
`.trim();

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: fullPrompt }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: 512,
    },
  });

  const text = extractGeminiText(result?.response);

  if (!text) {
    console.error("❌ Gemini returned no usable text");
    console.error(
      "🔍 Raw Gemini response:",
      JSON.stringify(result?.response, null, 2).slice(0, 3000)
    );
    throw new Error("Vertex returned no usable response");
  }

  return {
    reply: text,
    modelUsed: modelName,
  };
}
