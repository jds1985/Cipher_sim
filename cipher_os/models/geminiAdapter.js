// cipher_os/models/geminiAdapter.js

export async function geminiGenerate({
  systemPrompt,
  messages = [],
  userMessage,
  temperature = 0.6,
  signal,
}) {
  console.log("[Gemini] called");

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const model = "gemini-1.5-flash";

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...messages.map((m) => ({
      role: "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
        },
      }),
      signal,
    }
  );

  const data = await response.json();

  console.log("[Gemini] status:", response.status);
  console.log("[Gemini] raw:", data);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini error");
  }

  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "…";

  return {
    reply,
    raw: data,
    modelUsed: model,
  };
}
