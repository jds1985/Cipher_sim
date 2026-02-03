export async function geminiGenerate({
  systemPrompt,
  messages = [],
  userMessage,
  temperature = 0.6,
  signal,
}) {
  console.log("[Gemini] called");

  if (!process.env.GEMINI_API_KEY) {
    console.error("[Gemini] Missing GEMINI_API_KEY");
    return null; // soft fail
  }

  const model = "models/gemini-pro";

  const contents = [
    { parts: [{ text: systemPrompt }] },
    ...messages.map((m) => ({
      parts: [{ text: m.content }],
    })),
    { parts: [{ text: userMessage }] },
  ];

  let response;
  let data;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    data = await response.json();
  } catch (err) {
    console.error("[Gemini] fetch failed:", err);
    return null;
  }

  console.log("[Gemini] response status:", response.status);
  console.log("[Gemini] raw:", data);

  if (!response.ok) {
    console.error("[Gemini] API error:", data?.error);
    return null; // DO NOT THROW
  }

  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!reply) {
    console.error("[Gemini] empty reply");
    return null;
  }

  return {
    reply,
    raw: data,
    modelUsed: model,
  };
}
