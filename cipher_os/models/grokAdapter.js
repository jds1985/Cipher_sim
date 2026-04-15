// cipher_os/models/grokAdapter.js

export async function callGrok({
  messages,
  model = "grok-1",
  temperature = 0.7,
  max_tokens = 1024,
}) {
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Grok API error: ${errText}`);
    }

    const data = await res.json();

    return {
      text: data.choices?.[0]?.message?.content || "",
      raw: data,
    };
  } catch (err) {
    console.error("Grok Adapter Error:", err);
    throw err;
  }
}
