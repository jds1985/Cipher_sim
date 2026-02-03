export async function anthropicGenerate({
  systemPrompt,
  messages = [],
  userMessage,
  temperature = 0.6,
  signal,
}) {
  console.log("[Claude] called");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[Claude] Missing ANTHROPIC_API_KEY");
    return null; // soft fail
  }

  const model = "claude-3-5-sonnet-20240620";

  let response;
  let data;

  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
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
        system: systemPrompt,
        messages: [
          ...messages,
          { role: "user", content: userMessage },
        ],
      }),
      signal,
    });

    data = await response.json();
  } catch (err) {
    console.error("[Claude] fetch failed:", err);
    return null;
  }

  console.log("[Claude] response status:", response.status);
  console.log("[Claude] raw:", data);

  if (!response.ok) {
    console.error("[Claude] API error:", data?.error);
    return null; // DO NOT THROW
  }

  const reply = data?.content?.[0]?.text?.trim();

  if (!reply) {
    console.error("[Claude] empty reply");
    return null;
  }

  return {
    reply,
    raw: data,
    modelUsed: model,
  };
}
