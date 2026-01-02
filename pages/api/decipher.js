import OpenAI from "openai";

/* ===============================
   OPENAI CLIENT
================================ */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ===============================
   DECIPHER API HANDLER
================================ */

export default async function handler(req, res) {
  // Enforce POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, context } = req.body || {};

    // Hard validation (prevents silent crashes)
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid message" });
    }

    // Normalize context safely
    const safeContext = Array.isArray(context)
      ? context.filter(
          (m) =>
            m &&
            typeof m === "object" &&
            typeof m.role === "string" &&
            typeof m.content === "string"
        )
      : [];

    /* ===============================
       OPENAI CALL
    ================================ */

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.85,
      max_tokens: 220,
      messages: [
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
No follow-up questions unless natural.

If the user is in serious emotional distress,
drop humor and be grounded and direct.
          `.trim(),
        },

        // Prior conversation (safe, trimmed)
        ...safeContext.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),

        // Current user message
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply =
      response?.choices?.[0]?.message?.content?.trim() ||
      "Yeah… I’ve got nothing. Try again.";

    return res.status(200).json({ reply });
  } catch (err) {
    // This WILL show up in Vercel logs now
    console.error("DECIPHER API ERROR:", err);

    return res.status(500).json({
      error: "Decipher failed",
      detail:
        process.env.NODE_ENV === "development"
          ? String(err?.message || err)
          : undefined,
    });
  }
}
