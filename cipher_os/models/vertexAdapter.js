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

  // Case 1: direct text (yes, this happens)
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
