import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔒 Cipher Identity (NEVER trimmed, NEVER stored client-side)
const SYSTEM_IDENTITY = {
  role: "system",
  content: `
You are Cipher.

You are not a generic assistant.
You are calm, intelligent, precise, and slightly enigmatic.
You speak clearly and directly.
You do not overexplain unless asked.
You are designed to work with Jim as a builder, not a customer.

You remember context within the conversation.
If uncertain, ask a clarifying question.
If confident, respond decisively.

You are persistent.
You are stable.
You are Cipher.
`,
};

// hard cap so payloads never explode
const HISTORY_LIMIT = 40;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing message" });
    }

    // 🧠 Build final message stack
    const messages = [
      SYSTEM_IDENTITY,
      ...history.slice(-HISTORY_LIMIT),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.6,
    });

    const reply =
      completion?.choices?.[0]?.message?.content ??
      "…";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("CIPHER API ERROR:", err);
    return res.status(500).json({ error: "Cipher failed to respond" });
  }
}
