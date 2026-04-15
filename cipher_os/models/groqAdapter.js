// cipher_os/models/groqAdapter.js

/**
 * Groq Adapter — The Sovereign Judge (v1.2)
 * Uses Groq's LPU hardware for near-instant ternary synthesis.
 * Forced Error Reporting: Sends API errors as chat replies for debugging.
 */
export async function groqGenerate({
  systemPrompt,
  userMessage,
  temperature = 0.3, 
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("ADAPTER ERROR: Missing GROQ_API_KEY");
    return { reply: "⚠️ ADAPTER ERROR: Missing GROQ_API_KEY in Vercel", modelUsed: "debug_error" };
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
        "Authorization": `Bearer ${apiKey.trim()}`, 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    // Log the full payload for Vercel console review
    console.log("DEBUG: Groq API Response:", JSON.stringify(data));

    if (!res.ok) {
      // FORCE THE ERROR INTO THE CHAT UI
      return { 
        reply: `⚠️ GROQ API ERROR: ${data.error?.message || res.status}`, 
        modelUsed: "error_debug" 
      };
    }

    return {
      reply: data.choices[0].message.content.trim(),
      modelUsed: "ternary_cluster_groq", 
    };
  } catch (err) {
    console.error("ADAPTER CRITICAL FAILURE:", err.message);
    // Force the crash reason into the chat UI
    return { 
      reply: `⚠️ ADAPTER CRASH: ${err.message}`, 
      modelUsed: "critical_debug" 
    };
  }
}
