import { VertexAI } from "@google-cloud/vertexai";

let vertex = null;

function getVertexClient() {
  if (vertex) return vertex;

  if (!process.env.VERTEX_JSON) {
    throw new Error("Missing VERTEX_JSON env var");
  }

  const credentials = JSON.parse(process.env.VERTEX_JSON);

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
  userMessage,
  temperature = 0.6,
}) {
  const client = getVertexClient();

  // Gemini model on Vertex
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const fullPrompt = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    ...messages,
    { role: "user", content: userMessage },
  ]
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

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
    result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Vertex returned empty response");
  }

  return text;
}
