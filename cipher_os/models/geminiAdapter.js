// cipher_os/models/geminiAdapter.js
// Gemini Adapter — VERIFIED WORKING (v1)

export async function geminiGenerate({
  systemPrompt,
  userMessage,
  temperature = 0.6,
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const model = "gemini-1.5-flash"; // stable + fast

  const url =
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=` +
    process.env.GEMINI_API_KEY;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemPrompt
              ? `${systemPrompt}\n\nUser: ${userMessage}`
              : userMessage,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  // 🔥 HARD FAIL IF SHAPE IS WRONG
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

  if (!text) {
    console.error("❌ Gemini empty response", JSON.stringify(data));
    return null;
  }

  return {
    reply: text,
    modelUsed: model,
  };
}
