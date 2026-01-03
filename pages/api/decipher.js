// pages/api/decipher.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // never cache
  res.setHeader("Cache-Control", "no-store");

  // hard backend timeout
  const timeout = setTimeout(() => {
    try {
      res.status(504).json({ error: "Decipher timeout" });
    } catch {}
  }, 25000);

  try {
    const { message, context = [] } = req.body;

    if (!message || typeof message !== "string") {
      clearTimeout(timeout);
      return res.status(400).json({ error: "Missing message" });
    }

    const HISTORY_LIMIT = 12;
    const trimmedContext = context.slice(-HISTORY_LIMIT);

    const messages = [
      {
        role: "system",
        content: `
You are DECIPHER.

You are blunt, dry, darkly humorous, and honest.
You do NOT comfort.
You do NOT coddle.
You do NOT over-explain.

You speak like a sharp best friend who tells the truth
without cruelty.

No emojis.
No therapy language.
No AI disclaimers.

If the user is in serious emotional distress,
drop humor and be grounded and direct.
        `.trim(),
      },
      ...trimmedContext,
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
        temperature: 0.85,
        max_tokens: 220,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("DECIPHER OPENAI ERROR:", data);
      clearTimeout(timeout);
      return res.status(500).json({ error: "OpenAI error" });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Yeah. That silence says enough.";

    clearTimeout(timeout);
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("DECIPHER API CRASH:", err);
    clearTimeout(timeout);
    return res.status(500).json({ error: "Decipher failed" });
  }
}
