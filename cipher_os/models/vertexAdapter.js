// cipher_os/models/vertexAdapter.js
// Vertex AI (Gemini) adapter for Cipher OS

import { VertexAI } from "@google-cloud/vertexai";

let vertex = null;

function getVertexClient() {
  if (vertex) return vertex;

  if (!process.env.VERTEX_JSON) {
    throw new Error("Missing VERTEX_JSON env var");
  }

  // IMPORTANT: VERTEX_JSON must be valid JSON (raw or base64-decoded upstream)
  let credentials;
  try {
    credentials = JSON.parse(process.env.VERTEX_JSON);
  } catch (err) {
    throw new Error("VERTEX_JSON is not valid JSON");
  }

  vertex = new VertexAI({
    project: credentials.project_id,
    location: "us-central1",
    credentials,
  });

  return vertex;
}

export async function vertexGenerate({
  systemPrompt = "",
  messages = [],
  userMessage = "",
  temperature = 0.6,
}) {
  console.log("🔥 VERTEX GENERATE CALLED");

  const client = getVertexClient();

  // Gemini model on Vertex
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  // Build a single prompt string (Vertex prefers plain text)
  const fullPrompt = [
    ...(systemPrompt ? [`SYSTEM: ${systemPrompt}`] : []),
    ...messages.map((m) => `${m.role?.toUpperCase() || "USER"}: ${m.content}`),
    `USER: ${userMessage}`,
  ].join("\n");

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: fullPrompt }],
      },
    ],
    generationConfig: {
      temperature,
    },
  });

  const text =
    result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  console.log("🧠 VERTEX RAW RESULT:", JSON.stringify(result?.response, null, 2));

  if (!text) {
    throw new Error("Vertex returned empty response");
  }

  console.log("✅ VERTEX RESPONSE OK");

  // IMPORTANT: return object, not string
  return {
    reply: text,
    modelUsed: "gemini-1.5-flash (vertex)",
    raw: result.response,
  };
}
