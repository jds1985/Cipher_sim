// cipher_os/models/geminiAdapter.js
// Gemini Adapter — HARDENED (v2)
// Fixes: v1 vs v1beta model availability + proper error throwing + model fallback list

export async function geminiGenerate({
  systemPrompt,
  userMessage,
  temperature = 0.6,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  // ✅ Most Gemini model IDs for generateContent are exposed under v1beta.
  // Allow override via env if needed.
  const apiVersion = process.env.GEMINI_API_VERSION || "v1beta";

  // ✅ Let you force a specific model via env (recommended once you find a working one)
  // Example: GEMINI_MODEL="gemini-2.5-flash"
  const forcedModel = (process.env.GEMINI_MODEL || "").trim();

  // ✅ Fallback model candidates (ordered fastest/cheapest-first)
  // Some accounts/projects expose different sets; we try multiple.
  const modelCandidates = forcedModel
    ? [forcedModel]
    : [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
      ];

  const base = `https://generativelanguage.googleapis.com/${apiVersion}`;

  // Build prompt as a single user text (simple + compatible)
  const promptText = systemPrompt
    ? `${systemPrompt}\n\nUser: ${userMessage}`
    : userMessage;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: promptText }],
      },
    ],
    generationConfig: { temperature },
  };

  let lastErr = null;

  for (const model of modelCandidates) {
    const url = `${base}/models/${model}:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      // If model not found for this API version, try next model
      if (!res.ok) {
        const msg = data?.error?.message || `HTTP ${res.status}`;
        const err = new Error(`Gemini ${model} failed: ${msg}`);
        err.status = res.status;
        err.model = model;

        // 404/400 usually means "wrong model name / not enabled / not supported"
        if (res.status === 404 || res.status === 400) {
          lastErr = err;
          continue;
        }

        // Other errors (401, 429, 5xx) should bubble up
        throw err;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!text.trim()) {
        // Treat empty as failure for this model, try next
        lastErr = new Error(`Gemini ${model} returned empty candidates`);
        continue;
      }

      return {
        reply: text.trim(),
        modelUsed: model,
      };
    } catch (e) {
      lastErr = e;
      // For fetch/network errors, try next model once or twice, but don't hide forever
      continue;
    }
  }

  // If we got here, none of the models worked
  throw lastErr || new Error("Gemini failed: no working models found");
}
