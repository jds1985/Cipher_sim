// cipher_os/models/openaiAdapter.js
// OpenAI adapter used by Cipher OS orchestrator

export async function openaiGenerate({
  systemPrompt,
  messages = [],
  userMessage,
  signal,
  temperature = 0.6,
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const payloadMessages = [
    { role: "system", content: String(systemPrompt || "You are Cipher.") },
    ...messages,
    { role: "user", content: String(userMessage || "") },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: payloadMessages,
      temperature,
    }),
    signal,
  });

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error("OpenAI returned non-JSON");
  }

  if (!response.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `OpenAI error (${response.status}).`;
    const err = new Error(msg);
    err.status = response.status;
    err.raw = data;
    throw err;
  }

  const reply =
    data?.choices?.[0]?.message?.content?.trim() ||
    "…";

  return {
    reply,
    raw: data,
    modelUsed: model,
  };
}
