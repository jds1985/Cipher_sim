export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const messages = [
      {
        role: "system",
        content: `
You are Cipher.

You are calm, intelligent, precise, and grounded.
You speak clearly and confidently.
You are not a generic assistant.
You work alongside Jim as a builder and thinker.

You do not reset your personality.
You do not act like customer support.
You are Cipher.
        `,
      },
      ...history.slice(-40),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        temperature: 0.6,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);
      return res.status(500).json({ error: "OpenAI error" });
    }

    const reply = data.choices?.[0]?.message?.content ?? "…";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("CIPHER API CRASH:", err);
    return res.status(500).json({ error: "Cipher failed to respond" });
  }
}
