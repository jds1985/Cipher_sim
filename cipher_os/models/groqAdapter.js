// cipher_os/models/groqAdapter.js

/**
 * Groq Adapter — The Sovereign Judge (v1.0)
 * Uses Groq's LPU hardware for near-instant ternary synthesis.
 */
export async function groqGenerate({
  systemPrompt,
  userMessage,
  temperature = 0.3, // Low temperature for consistent logical merging
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY in Environment Variables");

  // Llama 3.3 70B is the 2026 standard for reasoning-heavy tasks on Groq
  const model = "llama-3.3-70b-versatile";

  const body = {
    model: model,
    messages: [
      {
        role: "system",
        content: systemPrompt || "You are State 0: The Balanced Truth.",
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    temperature: temperature,
    max_tokens: 2048, // Generous ceiling for the final synthesis
  };

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      // Catch rate limits (429) specifically for the free tier
      if (res.status === 429) {
        throw new Error("Groq Rate Limit reached. Wait 60 seconds.");
      }
      throw new Error(`Groq API Error: ${data.error?.message || res.status}`);
    }

    return {
      reply: data.choices[0].message.content.trim(),
      modelUsed: model,
    };
  } catch (err) {
    console.error("Groq Adapter Critical Failure:", err);
    throw err;
  }
}
