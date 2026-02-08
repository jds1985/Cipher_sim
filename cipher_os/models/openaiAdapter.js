// cipher_os/models/openaiAdapter.js
// OpenAI Adapter (non-stream + stream)

export async function openaiGenerate({
  systemPrompt,
  messages = [],
  userMessage,
  temperature = 0.6,
  signal,
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: systemPrompt || "You are Cipher OS." },
        ...(Array.isArray(messages) ? messages : []),
        { role: "user", content: userMessage },
      ],
    }),
    signal,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `OpenAI error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  const text =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    "";

  return {
    reply: String(text || "").trim(),
    modelUsed: model,
    raw: data,
  };
}

/**
 * Streaming generator.
 * Calls `onToken(deltaText)` as content arrives.
 * Returns { reply, modelUsed } when finished.
 */
export async function openaiGenerateStream({
  systemPrompt,
  messages = [],
  userMessage,
  temperature = 0.6,
  signal,
  onToken,
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt || "You are Cipher OS." },
        ...(Array.isArray(messages) ? messages : []),
        { role: "user", content: userMessage },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    let errText = "";
    try {
      errText = await response.text();
    } catch {}
    throw new Error(`OpenAI stream error ${response.status}: ${errText}`);
  }

  const reader = response.body?.getReader?.();
  if (!reader) {
    throw new Error("OpenAI stream: no readable body");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let full = "";

  // SSE parser (data: {...}\n\n)
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE events
    while (true) {
      const idx = buffer.indexOf("\n\n");
      if (idx === -1) break;

      const event = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      // each line can be "data: ...."
      const lines = event.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.replace(/^data:\s*/, "");
        if (payload === "[DONE]") {
          return { reply: full.trim(), modelUsed: model };
        }

        let json = null;
        try {
          json = JSON.parse(payload);
        } catch {
          continue;
        }

        const delta =
          json?.choices?.[0]?.delta?.content ??
          json?.choices?.[0]?.delta?.text ??
          "";

        if (delta) {
          full += delta;
          try {
            onToken?.(delta);
          } catch {}
        }
      }
    }
  }

  return { reply: full.trim(), modelUsed: model };
}
