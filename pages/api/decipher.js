// pages/api/decipher.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed." });
  }

  // never cache
  res.setHeader("Cache-Control", "no-store");

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        reply: "Server misconfigured. OPENAI_API_KEY missing.",
      });
    }

    const { message, context = [] } = req.body ?? {};

    if (!message || typeof message !== "string") {
      return res.status(200).json({
        reply: "Say something real.",
      });
    }

    const HISTORY_LIMIT = 12;

    // 🔑 CRITICAL FIX:
    // Normalize ANY non-supported roles before sending to OpenAI
    const normalizedContext = Array.isArray(context)
      ? context.slice(-HISTORY_LIMIT).map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: String(m.content || ""),
        }))
      : [];

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
      ...normalizedContext,
      { role: "user", content: message },
    ];

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages,
          temperature: 0.85,
          max_tokens: 220,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("DECIPHER OPENAI ERROR:", data);
      return res.status(200).json({
        reply: "Decipher hit resistance. Try again.",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Yeah. That silence says enough.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("DECIPHER API CRASH:", err);
    return res.status(200).json({
      reply: "Decipher slipped. Not gone. Try again.",
    });
  }
}
