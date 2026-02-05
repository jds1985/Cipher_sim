import { GoogleAuth } from "google-auth-library";

const LOCATION = process.env.VERTEX_LOCATION || "us-central1";
const MODEL = process.env.VERTEX_MODEL || "gemini-3-flash-preview";

let authClient = null;

function getCreds() {
  if (!process.env.VERTEX_JSON_B64) {
    throw new Error("VERTEX_JSON_B64 missing");
  }

  const raw = Buffer.from(
    process.env.VERTEX_JSON_B64,
    "base64"
  ).toString("utf8");

  return JSON.parse(raw);
}

async function getAuthClient() {
  if (authClient) return authClient;

  const creds = getCreds();

  const auth = new GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  authClient = await auth.getClient();
  return authClient;
}

export async function vertexGenerate({
  systemPrompt = "",
  userMessage,
  temperature = 0.6,
}) {
  console.log("🔥 VERTEX REST GENERATE CALLED");

  const creds = getCreds();
  const client = await getAuthClient();
  const token = await client.getAccessToken();

  const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${creds.project_id}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

  const prompt = `
${systemPrompt || "You are a helpful assistant."}

User:
${userMessage}

Respond clearly in plain text.
`.trim();

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
    }),
  });

  const json = await res.json();

  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      .join("") || null;

  if (!text) {
    console.error("❌ Vertex REST returned no text");
    console.error(JSON.stringify(json, null, 2));
    throw new Error("Vertex returned no usable response");
  }

  return {
    reply: text.trim(),
    modelUsed: MODEL,
  };
}
