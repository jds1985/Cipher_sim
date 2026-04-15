// cipher_os/models/grokAdapter.js

export async function grokGenerate({
  systemPrompt,
  userMessage,
  temperature = 0.3,
}) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("Missing GROK_API_KEY");

  const model = "grok-4.20-reasoning"; 

  const body = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: temperature,
  };

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Grok API Error: ${data.error?.message || res.status}`);
    }

    return {
      reply: data.choices[0].message.content.trim(),
      modelUsed: model,
    };
  } catch (err) {
    console.error("Grok Adapter Failed:", err);
    throw err;
  }
}
