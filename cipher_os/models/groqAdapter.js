// cipher_os/models/groqAdapter.js

/**
 * Groq Adapter — The Sovereign Judge (v1.1)
 * Uses Groq's LPU hardware for near-instant ternary synthesis.
 * Added Deep Debugging to catch April 2026 API shifts.
 */
export async function groqGenerate({
  systemPrompt,
  userMessage,
  temperature = 0.3, 
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("ADAPTER ERROR: Missing GROQ_API_KEY in Environment Variables");
    throw new Error("Missing GROQ_API_KEY");
  }

  // Use the lightning-fast 2026 stable model
  const model = "llama-3.1-8b-instant";

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
    max_tokens: 2048,
  };

  try {
    console.log("DEBUG: Calling Groq with model:", model);
    
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        // .trim() ensures no hidden spaces break the handshake
        "Authorization": `Bearer ${apiKey.trim()}`, 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    // This will show up in your Vercel logs to tell us exactly what's wrong
    console.log("DEBUG: Groq API Response:", JSON.stringify(data));

    if (!res.ok) {
      if (res.status === 429) {
        console.error("ADAPTER ERROR: Rate limit hit");
        throw new Error("Groq Rate Limit reached.");
      }
      console.error("ADAPTER ERROR: API returned status", res.status);
      throw new Error(`Groq API Error: ${data.error?.message || res.status}`);
    }

    return {
      reply: data.choices[0].message.content.trim(),
      modelUsed: "ternary_cluster_groq", // Hardcoded label for the UI
    };
  } catch (err) {
    console.error("ADAPTER CRITICAL FAILURE:", err.message);
    // Return null so the orchestrator fallback triggers, but log the reason
    return { reply: null, error: err.message };
  }
}
