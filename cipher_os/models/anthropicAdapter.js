// cipher_os/models/anthropicAdapter.js
// Claude adapter (Anthropic)

export async function anthropicGenerate({
  systemPrompt,
  messages = [],
  userMessage,
  temperature = 0.6,
  signal,
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const model = "claude-3-5-sonnet-20240620";

  const fullPrompt = [
    systemPrompt,
    ...messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`),
    `USER: ${userMessage}`,
  ].join("\n\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature,
      messages: [
        { role: "user", content: fullPrompt }
      ],
    }),
    signal,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Claude error");
  }

  const reply =
    data?.content?.[0]?.text?.trim() ||
    "…";

  return {
    reply,
    raw: data,
    modelUsed: model,
  };
}
