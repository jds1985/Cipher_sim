// cipher_os/models/geminiAdapter.js

import { GoogleAuth } from "google-auth-library";

function parseServiceAccountJson() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    // Vercel env var is usually pasted as JSON text
    return JSON.parse(raw);
  } catch (e) {
    // If you stored it base64 instead, you can support that too:
    // const decoded = Buffer.from(raw, "base64").toString("utf8");
    // return JSON.parse(decoded);
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the full JSON contents from the service account key."
    );
  }
}

function toVertexContents(systemPrompt, messages, userMessage) {
  // Vertex expects: [{ role: "user"|"model", parts: [{text:"..."}]}]
  // Your app messages look like: [{role:"user"|"assistant", content:"..."}]
  const out = [];

  // We'll pass system prompt using systemInstruction (recommended),
  // not as a fake "user" message.
  for (const m of messages || []) {
    const role = m.role === "assistant" ? "model" : "user";
    out.push({
      role,
      parts: [{ text: String(m.content ?? "") }],
    });
  }

  // Append current user message
  out.push({
    role: "user",
    parts: [{ text: String(userMessage ?? "") }],
  });

  return out;
}

export async function geminiGenerate({
  systemPrompt,
  messages = [],
  userMessage,
  temperature = 0.6,
  signal,
}) {
  console.log("[Gemini/Vertex] called");

  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "global";

  if (!project) throw new Error("Missing GOOGLE_CLOUD_PROJECT");
  const serviceAccount = parseServiceAccountJson();
  if (!serviceAccount) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  // Pick a Vertex model id that is known to exist on Vertex global endpoint.
  // Example from Google docs: gemini-2.0-flash-001
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash-001";

  // Auth: service-account OAuth token for cloud-platform scope
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();
  const accessToken =
    typeof accessTokenResponse === "string"
      ? accessTokenResponse
      : accessTokenResponse?.token;

  if (!accessToken) {
    throw new Error("Failed to obtain Google OAuth access token.");
  }

  const url = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const contents = toVertexContents(systemPrompt, messages, userMessage);

  const body = {
    // System prompt goes here (Vertex supports systemInstruction)
    systemInstruction: systemPrompt
      ? { parts: [{ text: String(systemPrompt) }] }
      : undefined,

    contents,

    generationConfig: {
      temperature,
      // you can add: maxOutputTokens, topP, topK, etc.
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  const data = await response.json().catch(() => ({}));

  console.log("[Gemini/Vertex] status:", response.status);
  console.log("[Gemini/Vertex] raw:", data);

  if (!response.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `Vertex Gemini error (HTTP ${response.status})`;
    throw new Error(msg);
  }

  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "…";

  return {
    reply,
    raw: data,
    modelUsed: model,
  };
}
